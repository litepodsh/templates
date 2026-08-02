import { listTemplates } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const templates = await listTemplates();
	return { templates };
};
