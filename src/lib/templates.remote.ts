import { getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import * as z from 'zod';
import { getTemplate, listTemplates } from '$lib/server/catalog';
import {
	clientAddress,
	consumeSearchRateLimit,
	isSearchRateLimitAllowlisted,
} from '$lib/server/search-rate-limit';
import { findCachedTemplates } from '$lib/server/template-search-cache';

export const getTemplates = query(async () => listTemplates());

export const getTemplateById = query(z.string(), async (id) => {
	const template = await getTemplate(id);
	if (!template) error(404, `Template "${id}" not found`);
	return template;
});

const searchInput = z.object({
	q: z.string().default(''),
	categories: z.array(z.string()).default([]),
	limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Server-side counterpart of `/api/v1/templates?q=`, sharing the same Fuse
 * config so the browser and LitePod rank results identically.
 */
export const findTemplates = query(searchInput, async ({ q, categories, limit }) => {
	const event = getRequestEvent();
	const client = clientAddress(event);
	if (!isSearchRateLimitAllowlisted(event, client)) {
		const result = await consumeSearchRateLimit('ui', client);
		if (!result.allowed) {
			error(429, `Too many searches. Try again in ${result.retryAfterSeconds} seconds.`);
		}
	}

	return findCachedTemplates({
		query: q,
		category: categories,
		limit,
	});
});
