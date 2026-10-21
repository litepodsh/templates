import { siteOrigin } from '$lib/server/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	return { origin: siteOrigin(url) };
};
