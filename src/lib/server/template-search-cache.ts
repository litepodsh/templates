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

function cacheKey(input: TemplateSearchInput): string {
	const categories = Array.isArray(input.category)
		? [...input.category].sort()
		: input.category
			? [input.category]
			: [];
	const hash = createHash('sha256')
		.update(JSON.stringify([input.query ?? '', categories, input.limit ?? null]))
		.digest('base64url');
	return `templates:search:v1:${hash}`;
}
