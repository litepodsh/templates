/** Site-wide SEO constants shared by `<Seo>`, the sitemap and llms.txt. */

export const SITE_NAME = 'LitePod Templates';

export const SITE_DESCRIPTION =
	'Free catalog of self-hosted app templates: ready-to-deploy Docker Compose and Podman stacks with env files, setup notes and a public REST API.';

export const SITE_KEYWORDS = [
	'self-hosted',
	'self-hosting',
	'docker compose templates',
	'podman compose',
	'homelab',
	'open source apps',
	'compose.yml',
	'litepod',
];

export const OG_IMAGE = { path: '/og.png', width: 1200, height: 630, alt: 'LitePod Templates — self-hosted app templates' };

/** Serializes JSON-LD for `{@html}`; escaping `<` keeps `</script>` in data from closing the tag. */
export function jsonLd(data: unknown): string {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
