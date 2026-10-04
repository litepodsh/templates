import { listTemplates } from '$lib/server/catalog';
import { findCachedTemplates } from '$lib/server/template-search-cache';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const categories = url.searchParams.getAll('category');

	const templates = await listTemplates();
	// Filter during SSR so a shared `?q=` link doesn't flash the full catalog
	// before the client-side search kicks in.
	const results =
		q || categories.length > 0
			? await findCachedTemplates({ query: q, category: categories })
			: null;

	return { templates, results };
};
