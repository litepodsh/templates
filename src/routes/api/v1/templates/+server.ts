import { listTemplates } from '$lib/server/catalog';
import {
	clientAddress,
	consumeSearchRateLimit,
	isSearchRateLimitAllowlisted,
} from '$lib/server/search-rate-limit';
import { fail, ok } from '$lib/server/response';
import { findCachedTemplates } from '$lib/server/template-search-cache';
import { templateSummarySchema } from '$lib/server/schemas';
import { register } from '$lib/server/openapi-registry';
import type { RequestHandler } from './$types';

const MAX_LIMIT = 100;

register({
	method: 'GET',
	path: '/api/v1/templates',
	summary: 'List or search templates',
	description:
		'Without `q`, returns every valid template sorted by name. With `q`, runs a fuzzy search (Fuse.js, weighted towards the name) and returns matches ordered by relevance. Searches (`q` or `category`) are limited to 250 requests per minute per client IP; exceeding that quota blocks searches from that client for 5 minutes. The response shape is the same either way.',
	tags: ['templates'],
	operationId: 'listTemplates',
	params: [
		{
			name: 'q',
			in: 'query',
			required: false,
			description: 'Fuzzy search term, matched against name, tags, categories, description and id.',
			schema: { type: 'string' },
			example: 'mail',
		},
		{
			name: 'category',
			in: 'query',
			required: false,
			description: 'Keep only templates declaring one of these categories. Repeat the parameter to OR multiple values. Combines with `q`.',
			schema: { type: 'array', items: { type: 'string' } },
			example: 'email',
		},
		{
			name: 'limit',
			in: 'query',
			required: false,
			description: 'Cap the number of results. Applied after filtering.',
			schema: { type: 'integer', minimum: 1, maximum: 100 },
			example: 20,
		},
	],
	responses: {
		'200': { description: 'The catalog, or the matching subset', schema: templateSummarySchema.array() },
		'422': { description: 'Invalid `limit`', schema: templateSummarySchema.array() },
		'429': {
			description: 'Search rate limit exceeded. Retry after the number of seconds in the `Retry-After` header.',
			headers: {
				'Retry-After': { description: 'Seconds until this client may make another search request.', schema: { type: 'integer', minimum: 1 } },
			},
			schema: templateSummarySchema.array(),
		},
	},
});

export const GET: RequestHandler = async ({ url, ...event }) => {
	const query = url.searchParams.get('q') ?? undefined;
	const categories = url.searchParams.getAll('category');
	const rawLimit = url.searchParams.get('limit');

	let limit: number | undefined;
	if (rawLimit !== null) {
		limit = Number(rawLimit);
		if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
			return fail(422, `limit must be an integer between 1 and ${MAX_LIMIT}`);
		}
	}

	if (query || categories.length > 0) {
		const client = clientAddress(event);
		if (!isSearchRateLimitAllowlisted(event, client)) {
			const result = await consumeSearchRateLimit('api', client);
			if (!result.allowed) {
				return fail(429, `Too many searches. Try again in ${result.retryAfterSeconds} seconds.`, {
					headers: { 'retry-after': String(result.retryAfterSeconds) },
				});
			}
		}
	}

	if (!query && categories.length === 0) return ok(await listTemplates());

	return ok(await findCachedTemplates({
		query,
		category: categories,
		limit,
	}));
};
