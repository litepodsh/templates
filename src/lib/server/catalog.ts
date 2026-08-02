import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { dev } from '$app/env';
import { parse as parseToml } from 'smol-toml';
import * as z from 'zod';
import { parse as parseYaml } from 'yaml';
import { sanitizeMarkdown } from '$lib/server/markdown';
import { uiBaseUrl } from '$lib/server/config';
import type { TemplateDetail, TemplateSummary } from '$lib/types';

export type { TemplateDetail, TemplateSummary } from '$lib/types';

/**
 * Template ids are the only user-controlled path segment, so they are the only
 * place traversal could enter. Everything is rejected up front rather than
 * sanitised — a valid id can never contain a separator or a dot-segment.
 */
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

const ICON_CONTENT_TYPES: Record<string, string> = {
	'.webp': 'image/webp',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.svg': 'image/svg+xml',
};

const MANIFEST_FILENAME = 'template.toml';
const DEFAULT_COMPOSE_FILE = 'compose.yml';
const DEFAULT_ENV_FILE = '.env';
const DEFAULT_SETUP_FILE = 'setup.md';

const manifestSchema = z.object({
	template: z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().default(''),
		version: z.string().default('0.0.0'),
		categories: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
		icon: z.string().optional(),
		website: z.string().optional(),
		docs: z.string().optional(),
		source: z.string().optional(),
		license: z.string().optional(),
	}),
	files: z
		.object({
			compose: z.string().default(DEFAULT_COMPOSE_FILE),
			env: z.string().default(DEFAULT_ENV_FILE),
			setup: z.string().optional(),
		})
		.default({ compose: DEFAULT_COMPOSE_FILE, env: DEFAULT_ENV_FILE }),
	ports: z
		.array(
			z.object({
				container: z.number().int(),
				description: z.string().optional(),
				primary: z.boolean().optional(),
			}),
		)
		.default([]),
});

type Manifest = z.infer<typeof manifestSchema>;

type LoadedTemplate = {
	summary: TemplateSummary;
	dir: string;
	files: Manifest['files'];
	iconFilename: string | null;
	setupFilename: string | null;
};

type ComposeService = {
	image?: unknown;
	ports?: unknown;
};

type ComposeDoc = {
	services?: Record<string, ComposeService>;
};

/**
 * Picks the image tag of the service that owns the primary port so the card
 * shows what users actually deploy. Falls back to the first service with an
 * image when the primary port can't be matched, and to `null` when no service
 * declares one.
 */
function readPrimaryImageTag(compose: string, primaryPort: number | undefined): string | null {
	let doc: ComposeDoc;
	try {
		doc = parseYaml(compose) as ComposeDoc;
	} catch {
		return null;
	}
	const services = doc.services;
	if (!services) return null;

	const entries = Object.entries(services);
	if (entries.length === 0) return null;

	const matching =
		primaryPort === undefined
			? undefined
			: entries.find(([, service]) => serviceOwnsPort(service, primaryPort));

	const target = matching ?? entries.find(([, service]) => typeof service.image === 'string');
	if (!target) return null;

	const tag = imageTagOf(target[1].image);
	return tag && tag !== 'latest' ? tag : tag;
}

function serviceOwnsPort(service: ComposeService, port: number): boolean {
	const ports = service.ports;
	if (!Array.isArray(ports)) return false;
	return ports.some((entry) => {
		if (typeof entry === 'number') return entry === port;
		if (typeof entry === 'string') {
			// Short syntax: `HOST:CONTAINER`, `IP:HOST:CONTAINER`, or bare `CONTAINER[/PROTO]`.
			// The container port is always the last colon-separated segment.
			const lastSegment = entry.split(':').pop()?.split('/')[0];
			return lastSegment !== undefined && Number(lastSegment) === port;
		}
		if (entry && typeof entry === 'object') {
			const published = (entry as { published?: unknown }).published;
			const target = (entry as { target?: unknown }).target;
			return published === port || target === port;
		}
		return false;
	});
}

function imageTagOf(image: unknown): string | null {
	if (typeof image !== 'string') return null;
	// Strip registry and image name; keep only the tag (or `latest` when absent).
	const afterLastColon = image.split(':').pop();
	if (!afterLastColon || afterLastColon.includes('/')) return 'latest';
	return afterLastColon.replace(/^v/, '');
}

export function templatesDir(): string {
	return path.resolve(process.cwd(), process.env.TEMPLATES_DIR ?? 'templates');
}

function isValidId(id: string): boolean {
	return ID_PATTERN.test(id);
}

/**
 * Resolves a filename declared in a manifest against its template directory,
 * refusing anything that escapes the directory. Manifests are contributed
 * content, so `compose = "../../etc/passwd"` has to fail here.
 */
function resolveInside(dir: string, filename: string): string | null {
	const resolved = path.resolve(dir, filename);
	const prefix = dir.endsWith(path.sep) ? dir : dir + path.sep;
	return resolved.startsWith(prefix) ? resolved : null;
}

async function loadTemplate(dir: string, id: string): Promise<LoadedTemplate | null> {
	let raw: string;
	try {
		raw = await readFile(path.join(dir, MANIFEST_FILENAME), 'utf8');
	} catch {
		// A directory without a manifest simply isn't a template.
		return null;
	}

	const parsed = manifestSchema.safeParse(parseToml(raw));
	if (!parsed.success) {
		console.warn(`[templates] ${id}/${MANIFEST_FILENAME} is invalid:`, z.prettifyError(parsed.error));
		return null;
	}

	const manifest = parsed.data;
	if (manifest.template.id !== id) {
		console.warn(
			`[templates] ${id}/${MANIFEST_FILENAME} declares id "${manifest.template.id}" but lives in "${id}" — skipping.`,
		);
		return null;
	}

	const externalIconUrl = resolveExternalIconUrl(manifest.template.icon);
	const iconFilename = externalIconUrl ? null : await resolveIconFilename(dir, manifest.template.icon);
	const extension = iconFilename ? path.extname(iconFilename).toLowerCase() : null;

	const composeFilename = manifest.files.compose;
	const composePath = resolveInside(dir, composeFilename);
	const appVersion = await readComposeAppVersion(composePath, primaryPort(manifest.ports));
	const setupFilename = await resolveSetupFilename(dir, manifest.files.setup);

	return {
		dir,
		files: manifest.files,
		iconFilename,
		setupFilename,
		summary: {
			id,
			name: manifest.template.name,
			description: manifest.template.description,
			version: manifest.template.version,
			appVersion: appVersion ?? undefined,
			categories: manifest.template.categories,
			tags: manifest.template.tags,
			icon: externalIconUrl
				? { path: externalIconUrl }
				: iconFilename && extension
					? { path: `/api/v1/templates/${id}/icon`, contentType: ICON_CONTENT_TYPES[extension] }
					: null,
			website: manifest.template.website,
			docs: manifest.template.docs,
			source: manifest.template.source,
			license: manifest.template.license,
			ports: manifest.ports,
			ui: uiBaseUrl(id),
		},
	};
}

function primaryPort(ports: Manifest['ports']): number | undefined {
	return ports.find((port) => port.primary)?.container;
}

async function readComposeAppVersion(
	composePath: string | null,
	primaryPort: number | undefined,
): Promise<string | null> {
	if (!composePath) return null;
	try {
		const content = await readFile(composePath, 'utf8');
		return readPrimaryImageTag(content, primaryPort);
	} catch {
		return null;
	}
}

/** Accept only external image URLs the browser can fetch safely from an <img>. */
function resolveExternalIconUrl(declared: string | undefined): string | null {
	if (!declared) return null;

	try {
		const url = new URL(declared);
		if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
		console.warn(`[templates] unsupported icon URL protocol "${url.protocol}"`);
	} catch {
		// Not a URL — treat it as a local filename below.
	}

	return null;
}

/**
 * Uses the manifest's `icon` when it names a readable file with a supported
 * extension; otherwise falls back to the first `logo.*` in the directory, so a
 * template can ship an icon without declaring one.
 */
async function resolveIconFilename(dir: string, declared: string | undefined): Promise<string | null> {
	if (declared) {
		const extension = path.extname(declared).toLowerCase();
		const resolved = resolveInside(dir, declared);
		if (resolved && extension in ICON_CONTENT_TYPES) {
			try {
				await stat(resolved);
				return declared;
			} catch {
				console.warn(`[templates] declared icon "${declared}" not found in ${dir}`);
			}
		} else {
			console.warn(`[templates] unsupported or out-of-tree icon "${declared}" in ${dir}`);
		}
	}

	try {
		const entries = await readdir(dir, { withFileTypes: true });
		const match = entries.find(
			(entry) =>
				entry.isFile() &&
				path.basename(entry.name, path.extname(entry.name)).toLowerCase() === 'logo' &&
				path.extname(entry.name).toLowerCase() in ICON_CONTENT_TYPES,
		);
		return match?.name ?? null;
	} catch {
		return null;
	}
}

/**
 * Resolves the template's setup markdown file. Uses `[files].setup` when
 * declared; otherwise looks for a `setup.md` in the directory, so a template
 * can ship setup notes without touching the manifest. Returns `null` when
 * nothing is found, which the API surfaces as a `null` `setup` field.
 */
async function resolveSetupFilename(dir: string, declared: string | undefined): Promise<string | null> {
	if (declared) {
		const resolved = resolveInside(dir, declared);
		if (resolved) {
			try {
				await stat(resolved);
				return declared;
			} catch {
				console.warn(`[templates] declared setup "${declared}" not found in ${dir}`);
				return null;
			}
		}
		console.warn(`[templates] out-of-tree setup "${declared}" in ${dir}`);
		return null;
	}

	try {
		await stat(path.join(dir, DEFAULT_SETUP_FILE));
		return DEFAULT_SETUP_FILE;
	} catch {
		return null;
	}
}

async function scan(): Promise<Map<string, LoadedTemplate>> {
	const root = templatesDir();
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch {
		console.warn(`[templates] catalog directory ${root} is not readable — serving an empty catalog.`);
		return new Map();
	}

	const loaded = await Promise.all(
		entries
			.filter((entry) => entry.isDirectory() && isValidId(entry.name))
			.map((entry) => loadTemplate(path.join(root, entry.name), entry.name)),
	);

	return new Map(
		loaded
			.filter((template): template is LoadedTemplate => template !== null)
			.sort((a, b) => a.summary.name.localeCompare(b.summary.name))
			.map((template) => [template.summary.id, template]),
	);
}

let cache: Promise<Map<string, LoadedTemplate>> | null = null;

/** Re-scans on every call in dev so adding a template is a refresh, not a restart. */
function catalog(): Promise<Map<string, LoadedTemplate>> {
	if (dev) return scan();
	cache ??= scan();
	return cache;
}

async function find(id: string): Promise<LoadedTemplate | null> {
	if (!isValidId(id)) return null;
	return (await catalog()).get(id) ?? null;
}

export async function listTemplates(): Promise<TemplateSummary[]> {
	return [...(await catalog()).values()].map((template) => template.summary);
}

export async function getTemplate(id: string): Promise<TemplateDetail | null> {
	const template = await find(id);
	if (!template) return null;

	const composePath = resolveInside(template.dir, template.files.compose);
	if (!composePath) return null;

	let compose: string;
	try {
		compose = await readFile(composePath, 'utf8');
	} catch {
		console.warn(`[templates] ${id} declares compose "${template.files.compose}" but it is unreadable.`);
		return null;
	}

	const envPath = resolveInside(template.dir, template.files.env);
	let env: string | null = null;
	if (envPath) {
		env = await readFile(envPath, 'utf8').catch(() => null);
	}

	// Setup notes are sanitised before they leave the server so the consumer
	// (LitePod) and the catalog UI can render the markdown directly without
	// needing a second sanitisation pass. The content is still markdown, not
	// HTML — the renderer (e.g. a custom `marked` renderer) decides the HTML.
	let setup: TemplateDetail['setup'] = null;
	if (template.setupFilename) {
		const setupPath = resolveInside(template.dir, template.setupFilename);
		if (setupPath) {
			const raw = await readFile(setupPath, 'utf8').catch(() => null);
			if (raw !== null) {
				setup = { filename: template.setupFilename, content: sanitizeMarkdown(raw) };
			}
		}
	}

	// The manifest is re-read rather than re-serialised from the parsed value so
	// the UI shows the author's actual file, comments and formatting included.
	const manifest = await readFile(path.join(template.dir, MANIFEST_FILENAME), 'utf8');

	return {
		...template.summary,
		manifest: { filename: MANIFEST_FILENAME, content: manifest },
		compose: { filename: template.files.compose, content: compose },
		env: env === null ? null : { filename: template.files.env, content: env },
		setup,
	};
}

export async function readTemplateIcon(
	id: string,
): Promise<{ bytes: Buffer; contentType: string; etag: string } | null> {
	const template = await find(id);
	const contentType = template?.summary.icon?.contentType;
	if (!template?.iconFilename || !contentType) return null;

	const iconPath = resolveInside(template.dir, template.iconFilename);
	if (!iconPath) return null;

	try {
		const [bytes, stats] = await Promise.all([readFile(iconPath), stat(iconPath)]);
		return {
			bytes,
			contentType,
			etag: `"${stats.size.toString(16)}-${stats.mtimeMs.toString(16)}"`,
		};
	} catch {
		return null;
	}
}
