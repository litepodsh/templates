/**
 * Fills `[template].platforms` in every `template.toml` from the registries.
 *
 * A template supports a platform only when every image in its compose file
 * publishes it, so the result is the intersection across services.
 *
 *   bun scripts/platforms.ts                 # rewrite every manifest
 *   bun scripts/platforms.ts ghost immich    # only these templates
 *   bun scripts/platforms.ts --check         # exit 1 if any manifest is stale
 *
 * Docker Hub limits anonymous manifest requests per IP. Set DOCKERHUB_USERNAME
 * and DOCKERHUB_TOKEN to authenticate when running the whole catalog.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';

const ROOT = path.resolve(import.meta.dir, '..', 'templates');

const ACCEPT = [
	'application/vnd.oci.image.index.v1+json',
	'application/vnd.docker.distribution.manifest.list.v2+json',
	'application/vnd.oci.image.manifest.v1+json',
	'application/vnd.docker.distribution.manifest.v2+json',
].join(', ');

/**
 * Only platforms a LitePod host realistically runs on are recorded, so
 * manifests don't fill up with `ppc64le` and `s390x`.
 */
const TRACKED = new Set(['linux/amd64', 'linux/arm64', 'linux/arm/v7']);

/** Registries whose API host differs from the name used in image references. */
const API_HOSTS: Record<string, string> = { 'docker.io': 'registry-1.docker.io' };

type ImageRef = { registry: string; repository: string; reference: string };

type Platform = { os?: string; architecture?: string; variant?: string };

type Manifest = {
	mediaType?: string;
	manifests?: { platform?: Platform }[];
	config?: { digest: string };
};

function parseImage(image: string): ImageRef {
	const [name, digest] = image.split('@');
	const slash = name.indexOf('/');
	const registry = name.slice(0, slash);
	let rest = name.slice(slash + 1);
	let reference = digest ?? 'latest';
	const colon = rest.lastIndexOf(':');
	if (colon !== -1) {
		if (!digest) reference = rest.slice(colon + 1);
		rest = rest.slice(0, colon);
	}
	// `docker.io/ghost` is shorthand for the official `library/ghost`.
	if (registry === 'docker.io' && !rest.includes('/')) rest = `library/${rest}`;
	return { registry, repository: rest, reference };
}

const tokens = new Map<string, string>();

/** Anonymous (or Docker Hub basic-auth) bearer token from the registry's challenge. */
async function bearerToken(challenge: string, registry: string): Promise<string> {
	const params = Object.fromEntries(
		[...challenge.matchAll(/(\w+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
	);
	const url = new URL(params.realm);
	if (params.service) url.searchParams.set('service', params.service);
	if (params.scope) url.searchParams.set('scope', params.scope);

	const cached = tokens.get(url.href);
	if (cached) return cached;

	const headers: Record<string, string> = {};
	const { DOCKERHUB_USERNAME: user, DOCKERHUB_TOKEN: pass } = process.env;
	if (registry === 'docker.io' && user && pass) {
		headers.authorization = `Basic ${btoa(`${user}:${pass}`)}`;
	}

	const response = await fetch(url, { headers });
	if (!response.ok) throw new Error(`token ${url.host}: HTTP ${response.status}`);
	const body = (await response.json()) as { token?: string; access_token?: string };
	const token = body.token ?? body.access_token;
	if (!token) throw new Error(`token ${url.host}: no token in response`);
	tokens.set(url.href, token);
	return token;
}

/** Retries 429/5xx, honouring `Retry-After` when the registry sends one. */
async function fetchWithRetry(url: string, headers: Record<string, string>, attempts = 5): Promise<Response> {
	for (let attempt = 1; ; attempt++) {
		const response = await fetch(url, { headers });
		const retryable = response.status === 429 || response.status >= 500;
		if (!retryable || attempt === attempts) return response;
		const retryAfter = Number(response.headers.get('retry-after'));
		const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000;
		await Bun.sleep(Math.min(delay, 60_000));
	}
}

async function registryGet(ref: ImageRef, kind: 'manifests' | 'blobs', id: string): Promise<Response> {
	const host = API_HOSTS[ref.registry] ?? ref.registry;
	const url = `https://${host}/v2/${ref.repository}/${kind}/${id}`;
	const headers: Record<string, string> = { accept: ACCEPT };

	let response = await fetchWithRetry(url, headers);
	const challenge = response.headers.get('www-authenticate');
	if (response.status === 401 && challenge?.toLowerCase().startsWith('bearer')) {
		headers.authorization = `Bearer ${await bearerToken(challenge, ref.registry)}`;
		response = await fetchWithRetry(url, headers);
	}
	if (!response.ok) throw new Error(`${kind} ${ref.registry}/${ref.repository}:${id}: HTTP ${response.status}`);
	return response;
}

/** `linux/arm64/v8` is the same thing as `linux/arm64`; other variants (`arm/v7`) matter. */
function formatPlatform({ os, architecture, variant }: Platform): string | null {
	if (!os || !architecture || os === 'unknown' || architecture === 'unknown') return null;
	if (variant && !(architecture === 'arm64' && variant === 'v8')) return `${os}/${architecture}/${variant}`;
	return `${os}/${architecture}`;
}

const imagePlatforms = new Map<string, Promise<string[]>>();

function platformsOf(image: string): Promise<string[]> {
	let pending = imagePlatforms.get(image);
	if (!pending) {
		pending = fetchPlatforms(parseImage(image));
		imagePlatforms.set(image, pending);
	}
	return pending;
}

async function fetchPlatforms(ref: ImageRef): Promise<string[]> {
	const manifest = (await (await registryGet(ref, 'manifests', ref.reference)).json()) as Manifest;

	// Multi-arch index: platforms are listed inline. Attestations show up as
	// `unknown/unknown` and are dropped by `formatPlatform`.
	if (manifest.manifests) {
		return unique(manifest.manifests.map((entry) => (entry.platform ? formatPlatform(entry.platform) : null)));
	}

	// Single-arch image: the platform lives in the config blob.
	if (manifest.config) {
		const config = (await (await registryGet(ref, 'blobs', manifest.config.digest)).json()) as Platform;
		return unique([formatPlatform(config)]);
	}

	throw new Error(`unrecognised manifest ${manifest.mediaType ?? '(no mediaType)'}`);
}

function unique(values: (string | null)[]): string[] {
	return [...new Set(values.filter((value): value is string => value !== null))].sort();
}

async function composeImages(dir: string, composeFile: string): Promise<string[]> {
	const doc = parseYaml(await readFile(path.join(dir, composeFile), 'utf8')) as {
		services?: Record<string, { image?: unknown }>;
	};
	return unique(Object.values(doc.services ?? {}).map((service) => (typeof service.image === 'string' ? service.image : null)));
}

/**
 * Rewrites the `platforms` line in place, or adds it after `tags` (falling
 * back to the end of `[template]`), aligning `=` with the neighbouring keys.
 * A text edit rather than re-serialising keeps the author's comments.
 */
function writePlatforms(toml: string, platforms: string[]): string {
	const lines = toml.split('\n');
	const start = lines.findIndex((line) => line.trim() === '[template]');
	let end = lines.findIndex((line, index) => index > start && /^\s*\[/.test(line));
	if (end === -1) end = lines.length;

	const section = lines.slice(start + 1, end);
	const anchor = section.find((line) => /^tags\s*=/.test(line)) ?? section.find((line) => /^\w+\s*=/.test(line));
	const column = anchor ? anchor.indexOf('=') : 'platforms '.length;
	const value = `[${platforms.map((platform) => JSON.stringify(platform)).join(', ')}]`;
	const line = `${'platforms'.padEnd(column)}= ${value}`;

	const existing = section.findIndex((entry) => /^platforms\s*=/.test(entry));
	if (existing !== -1) {
		lines[start + 1 + existing] = line;
	} else {
		const tags = section.findIndex((entry) => /^tags\s*=/.test(entry));
		let insertAt = tags !== -1 ? start + 1 + tags + 1 : end;
		// Keep blank lines that close the section below the new key.
		if (tags === -1) while (insertAt > start + 1 && lines[insertAt - 1].trim() === '') insertAt -= 1;
		lines.splice(insertAt, 0, line);
	}
	return lines.join('\n');
}

type Outcome = { id: string; platforms?: string[]; changed?: boolean; error?: string };

async function processTemplate(id: string, check: boolean): Promise<Outcome> {
	const dir = path.join(ROOT, id);
	const manifestPath = path.join(dir, 'template.toml');
	const raw = await readFile(manifestPath, 'utf8');
	const manifest = parseToml(raw) as {
		template?: { platforms?: string[] };
		files?: { compose?: string };
	};

	try {
		const images = await composeImages(dir, manifest.files?.compose ?? 'compose.yml');
		if (images.length === 0) return { id, error: 'no images in compose file' };

		const perImage = await Promise.all(images.map(platformsOf));
		const platforms = perImage
			.reduce((acc, list) => acc.filter((platform) => list.includes(platform)))
			.filter((platform) => TRACKED.has(platform));
		const current = manifest.template?.platforms ?? [];
		const changed = JSON.stringify(current) !== JSON.stringify(platforms);

		if (changed && !check) await writeFile(manifestPath, writePlatforms(raw, platforms));
		return { id, platforms, changed };
	} catch (error) {
		return { id, error: error instanceof Error ? error.message : String(error) };
	}
}

async function main() {
	const args = process.argv.slice(2);
	const check = args.includes('--check');
	const requested = args.filter((arg) => !arg.startsWith('--'));

	const ids = requested.length > 0
		? requested
		: (await readdir(ROOT, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

	// A small pool keeps us polite towards rate-limited registries.
	const outcomes: Outcome[] = [];
	const queue = [...ids];
	await Promise.all(
		Array.from({ length: 4 }, async () => {
			for (let id = queue.shift(); id; id = queue.shift()) {
				const outcome = await processTemplate(id, check);
				outcomes.push(outcome);
				const status = outcome.error
					? `error: ${outcome.error}`
					: `${outcome.changed ? (check ? 'stale' : 'updated') : 'ok'}  ${outcome.platforms!.join(', ') || '(none in common)'}`;
				console.log(`${id.padEnd(28)} ${status}`);
			}
		}),
	);

	const failed = outcomes.filter((outcome) => outcome.error);
	const stale = outcomes.filter((outcome) => outcome.changed);
	console.log(`\n${outcomes.length} templates, ${stale.length} ${check ? 'stale' : 'updated'}, ${failed.length} failed`);
	if (failed.length > 0 || (check && stale.length > 0)) process.exit(1);
}

await main();
