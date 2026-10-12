import Fuse, { type IFuseOptions } from 'fuse.js';
import type { TemplateSummary } from '$lib/types';

/**
 * Shared by the catalog UI and the `/api/v1/templates` endpoint so both
 * rank identically — a result the browser shows and a result LitePod fetches
 * should never disagree.
 *
 * Fuzzy so "mailpt" or "smpt" still finds Mailpit, weighted towards the name
 * because a tag match is a weaker signal than a title match. `ignoreLocation`
 * because a match at the end of a description is as good as one at the start.
 */
export const SEARCH_OPTIONS: IFuseOptions<TemplateSummary> = {
	threshold: 0.4,
	ignoreLocation: true,
	includeScore: true,
	keys: [
		{ name: 'name', weight: 3 },
		{ name: 'tags', weight: 2 },
		{ name: 'categories', weight: 1.5 },
		{ name: 'description', weight: 1 },
		{ name: 'id', weight: 1 },
	],
};

export type SearchHit = {
	/** Fuse relevance, 0 = exact. Null when no query was given (unranked). */
	score: number | null;
	template: TemplateSummary;
};

export function createTemplateIndex(templates: TemplateSummary[]): Fuse<TemplateSummary> {
	return new Fuse(templates, SEARCH_OPTIONS);
}

export type SearchParams = {
	query?: string;
	/** One or more categories — a template passes if it matches ANY of them. */
	category?: string | string[];
	/** One or more architectures (`arm64`) or platforms (`linux/arm64`) — ANY must match. */
	arch?: string | string[];
	limit?: number;
};

function normalizeList(value: string | string[] | undefined): string[] {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

/** `arm64` matches `linux/arm64`; a full platform must match exactly. */
export function supportsArch(template: TemplateSummary, arch: string): boolean {
	return template.platforms.some((platform) => platform === arch || platform.split('/')[1] === arch);
}

export function searchTemplates(
	templates: TemplateSummary[],
	fuse: Fuse<TemplateSummary>,
	{ query, category, arch, limit }: SearchParams = {},
): SearchHit[] {
	const term = query?.trim() ?? '';
	const wanted = normalizeList(category);
	const archs = normalizeList(arch);

	// Fuse orders by relevance; with no term keep the catalog's own A-Z order.
	let hits: SearchHit[] = term
		? fuse.search(term).map((hit) => ({ score: hit.score ?? null, template: hit.item }))
		: templates.map((template) => ({ score: null, template }));

	if (wanted.length > 0) {
		hits = hits.filter((hit) => hit.template.categories.some((c) => wanted.includes(c)));
	}

	// Templates with unknown platforms never pass an arch filter.
	if (archs.length > 0) {
		hits = hits.filter((hit) => archs.some((a) => supportsArch(hit.template, a)));
	}

	// Applied after filtering so a category never silently truncates the results.
	return limit === undefined ? hits : hits.slice(0, limit);
}
