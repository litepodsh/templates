// Mirrors LitePod's `api/src/deployment/compose/domain_markers.rs`. Keep the grammar in sync.
// Pure module: no `$app/*` imports, so `bun test` can load it directly.
import { parse as parseYaml } from 'yaml';

export type MarkerTarget =
	| { kind: 'primary' }
	| { kind: 'port'; port: number }
	| { kind: 'service-port'; service: string; port: number };

export type MarkerPort = { container: number; service?: string; description?: string; primary?: boolean };

const SERVICE_NAME = /^[A-Za-z0-9._-]+$/;

function parsePort(text: string): number | null {
	if (!/^\d+$/.test(text)) return null;
	const port = Number(text);
	return port >= 1 && port <= 65535 ? port : null;
}

/** `null` when `inner` is not a domain marker at all; throws when it is one but malformed. */
function parseInner(inner: string): MarkerTarget | null {
	const trimmed = inner.trim();
	const prefix = trimmed.startsWith('url') ? 'url' : trimmed.startsWith('domain') ? 'domain' : null;
	if (!prefix) return null;
	const rest = trimmed.slice(prefix.length);
	if (rest === '') return { kind: 'primary' };
	if (!rest.startsWith(':')) return null;
	const parts = rest.slice(1).split(':');
	if (parts.length === 1) {
		const port = parsePort(parts[0]);
		if (port !== null) return { kind: 'port', port };
	} else if (parts.length === 2 && SERVICE_NAME.test(parts[0])) {
		const port = parsePort(parts[1]);
		if (port !== null) return { kind: 'service-port', service: parts[0], port };
	}
	throw new Error(`malformed domain marker {{${inner}}}`);
}

export function findDomainMarkers(value: string): { raw: string; target: MarkerTarget }[] {
	const found: { raw: string; target: MarkerTarget }[] = [];
	let index = 0;
	while (true) {
		const start = value.indexOf('{{', index);
		if (start === -1) break;
		const end = value.indexOf('}}', start + 2);
		if (end === -1) break;
		const inner = value.slice(start + 2, end);
		const target = parseInner(inner);
		if (target) found.push({ raw: `{{${inner}}}`, target });
		index = end + 2;
	}
	return found;
}

function envEntries(env: string): [string, string][] {
	return env
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#') && line.includes('='))
		.map((line) => {
			const at = line.indexOf('=');
			return [line.slice(0, at), line.slice(at + 1)];
		});
}

export function envUsesDomainMarkers(env: string): boolean {
	return envEntries(env).some(([, value]) => {
		try {
			return findDomainMarkers(value).length > 0;
		} catch {
			return true;
		}
	});
}

function containerPort(entry: unknown): number | null {
	if (typeof entry === 'number') return parsePort(String(entry));
	if (typeof entry === 'string') {
		const last = entry.split(':').pop() ?? '';
		return parsePort(last.split('/')[0].trim());
	}
	if (entry && typeof entry === 'object' && 'target' in entry) {
		return parsePort(String((entry as { target: unknown }).target).split('/')[0]);
	}
	return null;
}

function servicePorts(service: unknown): number[] {
	if (!service || typeof service !== 'object') return [];
	const { ports, expose } = service as { ports?: unknown; expose?: unknown };
	return [...(Array.isArray(ports) ? ports : []), ...(Array.isArray(expose) ? expose : [])]
		.map(containerPort)
		.filter((port): port is number => port !== null);
}

function services(compose: string): Record<string, unknown> {
	try {
		const doc = parseYaml(compose) as { services?: Record<string, unknown> } | null;
		return doc?.services ?? {};
	} catch {
		return {};
	}
}

export function servicesExposingPort(compose: string, port: number): string[] {
	return Object.entries(services(compose))
		.filter(([, service]) => servicePorts(service).includes(port))
		.map(([name]) => name);
}

function checkCatalogPort(declared: MarkerPort, compose: string): string | null {
	if (!declared.description?.trim()) return `[[ports]] ${declared.container} needs a description`;
	if (declared.service) {
		return servicePorts(services(compose)[declared.service]).includes(declared.container)
			? null
			: `service '${declared.service}' does not expose port ${declared.container}`;
	}
	const owners = servicesExposingPort(compose, declared.container);
	if (owners.length === 0) return `no service exposes port ${declared.container}`;
	if (owners.length > 1) {
		return `port ${declared.container} is exposed by several services (${owners.join(', ')}); set [[ports]].service`;
	}
	return null;
}

export function validateDomainMarkers(env: string, ports: MarkerPort[], compose: string): string[] {
	const errors: string[] = [];
	for (const [name, value] of envEntries(env)) {
		let markers;
		try {
			markers = findDomainMarkers(value);
		} catch (error) {
			errors.push(`${name}: ${(error as Error).message}`);
			continue;
		}
		for (const { target } of markers) {
			let problem: string | null;
			if (target.kind === 'service-port') {
				problem = servicePorts(services(compose)[target.service]).includes(target.port)
					? null
					: `service '${target.service}' does not expose port ${target.port}`;
			} else {
				const declared =
					target.kind === 'primary'
						? (ports.find((port) => port.primary) ?? ports[0])
						: ports.find((port) => port.container === target.port);
				problem = declared
					? checkCatalogPort(declared, compose)
					: target.kind === 'primary'
						? 'no [[ports]] entry to use as the primary port'
						: `port ${target.port} is not declared in [[ports]]`;
			}
			if (problem) errors.push(`${name}: ${problem}`);
		}
	}
	return [...new Set(errors)];
}

/**
 * LitePod versions that resolve `{{url}}` markers send `features=domain-markers`.
 * Older ones would hand the literal marker to the container, so marker templates
 * are hidden from them.
 */
export function supportsDomainMarkers(url: URL): boolean {
	return url.searchParams
		.getAll('features')
		.flatMap((value) => value.split(','))
		.some((feature) => feature.trim() === 'domain-markers');
}
