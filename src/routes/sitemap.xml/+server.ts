import { listTemplates, templatesLastModified } from '$lib/server/catalog';
import { siteOrigin } from '$lib/server/config';
import type { RequestHandler } from './$types';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Built from the catalog on every request, so adding or removing a template
 * folder updates the sitemap with no build step. Cached briefly at the edge.
 */
export const GET: RequestHandler = async ({ url }) => {
	const origin = siteOrigin(url);
	const [templates, lastModified] = await Promise.all([listTemplates(), templatesLastModified()]);
	const newest = Math.max(0, ...[...lastModified.values()].map((date) => date.getTime()));

	const entries = [
		{ loc: `${origin}/`, lastmod: newest ? new Date(newest) : undefined, priority: '1.0', changefreq: 'daily' },
		{ loc: `${origin}/docs`, lastmod: undefined, priority: '0.5', changefreq: 'monthly' },
		...templates
			.toSorted((a, b) => a.id.localeCompare(b.id))
			.map((template) => ({
				loc: `${origin}/t/${template.id}`,
				lastmod: lastModified.get(template.id),
				priority: '0.8',
				changefreq: 'weekly',
			})),
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(entry) =>
			`\t<url>\n\t\t<loc>${escapeXml(entry.loc)}</loc>\n${
				entry.lastmod ? `\t\t<lastmod>${entry.lastmod.toISOString()}</lastmod>\n` : ''
			}\t\t<changefreq>${entry.changefreq}</changefreq>\n\t\t<priority>${entry.priority}</priority>\n\t</url>`,
	)
	.join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600',
		},
	});
};
