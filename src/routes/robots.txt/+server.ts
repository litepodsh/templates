import { siteOrigin } from '$lib/server/config';
import type { RequestHandler } from './$types';

/** Dynamic so the `Sitemap:` line carries the deployed origin. */
export const GET: RequestHandler = ({ url }) => {
	const body = `# Allow every crawler, including AI search bots.
User-agent: *
Allow: /

Sitemap: ${siteOrigin(url)}/sitemap.xml
`;
	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' },
	});
};
