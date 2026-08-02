import { getTemplate } from '$lib/server/catalog';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const template = await getTemplate(params.id);
	if (!template) error(404, `Template "${params.id}" not found`);
	return { template };
};
