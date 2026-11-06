// LitePod support for Compose services in the host's network namespace
// (`network_mode: host`), used by apps that must see LAN multicast: Home
// Assistant's mDNS, Matter, HomeKit, SSDP. Keep in sync with LitePod's
// `api/src/deployment/compose_standalone/overrides.rs`.
// Pure module: no `$app/*` imports, so `bun test` can load it directly.
import { parse as parseYaml } from 'yaml';
import { servicesExposingPort } from './domain-markers';

export type HostNetworkPort = {
	container: number;
	service?: string;
	description?: string;
	primary?: boolean;
};

type ComposeService = {
	network_mode?: unknown;
	ports?: unknown;
	expose?: unknown;
};

function services(compose: string): Record<string, ComposeService> {
	let doc: { services?: Record<string, ComposeService> } | null;
	try {
		doc = parseYaml(compose) as typeof doc;
	} catch {
		return {};
	}
	return doc?.services ?? {};
}

function usesHostNetwork(service: ComposeService | undefined): boolean {
	const mode = service?.network_mode;
	return typeof mode === 'string' && mode.trim() === 'host';
}

/**
 * LitePod versions that route a host-networked service through the host gateway
 * send `features=host-network`. Older ones would attach the service to the
 * shared proxy network, which Compose rejects next to `network_mode: host`, so
 * these templates are hidden from them.
 */
export function supportsHostNetwork(url: URL): boolean {
	return url.searchParams
		.getAll('features')
		.flatMap((value) => value.split(','))
		.some((feature) => feature.trim() === 'host-network');
}

/**
 * Cross-checks a `[template].network = "host"` manifest against its Compose
 * file. A host-networked template that lies about its networking deploys into a
 * container Compose refuses to start, so the catalog rejects it at load time
 * instead of handing it to every LitePod.
 */
export function validateHostNetwork(
	network: string | undefined,
	ports: HostNetworkPort[],
	compose: string,
): string[] {
	const entries = Object.entries(services(compose));
	const hostServices = entries.filter(([, service]) => usesHostNetwork(service));
	const errors: string[] = [];

	if (network !== 'host') {
		if (hostServices.length > 0) {
			errors.push(
				`service '${hostServices[0][0]}' uses network_mode: host but [template].network is not "host"`,
			);
		}
		return errors;
	}

	if (hostServices.length === 0) {
		errors.push('[template].network is "host" but no service sets network_mode: host');
		return errors;
	}
	if (hostServices.length > 1) {
		errors.push(
			`only one service may set network_mode: host (${hostServices.map(([name]) => name).join(', ')})`,
		);
	}

	const [hostName, hostService] = hostServices[0];
	if (Array.isArray(hostService.ports) && hostService.ports.length > 0) {
		errors.push(
			`service '${hostName}' sets network_mode: host, so it must not publish ports: (use expose: — the host already owns them)`,
		);
	}

	const primary = ports.find((port) => port.primary) ?? ports[0];
	if (primary) {
		if (primary.service && primary.service !== hostName) {
			errors.push(
				`the primary port ${primary.container} belongs to '${primary.service}', but '${hostName}' is the host-networked service`,
			);
		} else if (!servicesExposingPort(compose, primary.container).includes(hostName)) {
			errors.push(
				`the host-networked service '${hostName}' does not expose the primary port ${primary.container}`,
			);
		}
	}

	return errors;
}
