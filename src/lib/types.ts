/**
 * Client-facing catalog types.
 *
 * Kept out of `$lib/server/` on purpose so `.svelte` files and the remote
 * functions can share them without pulling server-only modules into the
 * browser bundle.
 */

export type TemplatePort = {
	container: number;
	description?: string;
	primary?: boolean;
};

export type TemplateIcon = {
	/** URL the browser (and LitePod) fetches, not a filesystem path. */
	path: string;
	/** Present for local icons; the browser determines the type of external URLs. */
	contentType?: string;
};

export type TemplateFile = {
	filename: string;
	content: string;
};

export type TemplateSummary = {
	id: string;
	name: string;
	description: string;
	version: string;
	/**
	 * Image tag of the service that owns the primary port — what users actually
	 * deploy. Falls back to the manifest version when the compose can't tell us.
	 */
	appVersion?: string;
	categories: string[];
	tags: string[];
	icon: TemplateIcon | null;
	website?: string;
	docs?: string;
	source?: string;
	license?: string;
	ports: TemplatePort[];
	/**
	 * Canonical URL for this template's data — `${DOMAIN}/api/v1/templates/{id}`,
	 * or the relative path when `DOMAIN` is unset. Lets API consumers (LitePod)
	 * link to or re-fetch the template without building the path themselves.
	 */
	ui: string;
};

export type TemplateDetail = TemplateSummary & {
	manifest: TemplateFile;
	compose: TemplateFile;
	env: TemplateFile | null;
	/**
	 * Sanitized setup prose from the template's `setup.md` (or whatever
	 * `[files].setup` points at). Markdown, not HTML — the consumer renders
	 * it. Null when the template doesn't ship setup notes.
	 */
	setup: TemplateFile | null;
};
