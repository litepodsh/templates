/**
 * Public origin of the catalog UI, baked into API responses so consumers
 * (LitePod) can link to each template's detail page without building the path
 * themselves. Empty in dev — the API returns relative URLs, which is fine
 * while the consumer is on the same origin and intentionally breaks if it
 * isn't, so a missing deploy config is obvious.
 */
const domain = (process.env.DOMAIN ?? '').replace(/\/+$/, '');

/**
 * Canonical URL for a template's detail page: `${DOMAIN}/t/{id}` when `DOMAIN`
 * is set, otherwise the relative path.
 */
export function uiBaseUrl(id: string): string {
	const path = `/t/${id}`;
	return domain ? `${domain}${path}` : path;
}
