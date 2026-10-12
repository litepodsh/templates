import { createHash } from 'node:crypto';
import { listTemplates } from '$lib/server/catalog';
import { withDragonfly } from '$lib/server/dragonfly';
import { createTemplateIndex, searchTemplates } from '$lib/search';
import type { TemplateSummary } from '$lib/types';

export const SEARCH_CACHE_TTL_SECONDS = 2 * 60 * 60;

export type TemplateSearchInput = {
	query?: string;
	/** One or more categories — templates matching ANY of them are returned. */
	category?: string | string[];
	/** One or more architectures — templates supporting ANY of them are returned. */
	arch?: string | string[];
	limit?: number;
};

/**
 * Caches final search results, rather than the Fuse index, so the API and UI
 * can share them across node processes and deployments.
 */
export async function findCachedTemplates(input: TemplateSearchInput): Promise<TemplateSummary[]> {
	const key = cacheKey(input);
	const cached = await withDragonfly((redis) => redis.get(key));
	if (cached) {
		try {
			return JSON.parse(cached) as TemplateSummary[];
		} catch {
			// A malformed value is treated as a miss and replaced below.
		}
	}

	const templates = await listTemplates();
	const results = searchTemplates(templates, createTemplateIndex(templates), input).map((hit) => hit.template);
	await withDragonfly((redis) =>
		redis.set(key, JSON.stringify(results), { expiration: { type: 'EX', value: SEARCH_CACHE_TTL_SECONDS } }),
	);
	return results;
}

function sortedList(value: string | string[] | undefined): string[] {
	if (Array.isArray(value)) return [...value].sort();
	return value ? [value] : [];
}

function cacheKey(input: TemplateSearchInput): string {
	const hash = createHash('sha256')
		.update(
			JSON.stringify([input.query ?? '', sortedList(input.category), sortedList(input.arch), input.limit ?? null]),
		)
		.digest('base64url');
	// v2: results now carry `platforms` and the key includes `arch`.
	return `templates:search:v2:${hash}`;
}
