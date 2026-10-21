import { listTemplates } from '$lib/server/catalog';
import { siteOrigin } from '$lib/server/config';
import { SITE_DESCRIPTION, SITE_NAME } from '$lib/seo';
import type { RequestHandler } from './$types';

/** llms.txt (https://llmstxt.org): a Markdown map of the catalog for AI assistants and answer engines. */
export const GET: RequestHandler = async ({ url }) => {
	const origin = siteOrigin(url);
	const templates = (await listTemplates()).toSorted((a, b) => a.name.localeCompare(b.name));

	const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Each template is a folder with a \`compose.yml\`, an \`.env\` of tunables (secrets are generated at deploy time), an icon and a \`template.toml\` manifest. Templates are deployed by LitePod on rootless Podman, and also work with \`docker compose\` / \`podman compose\`.

## API

- [OpenAPI spec](${origin}/api/v1/openapi.json): machine-readable description of the REST API
- [List templates](${origin}/api/v1/templates): JSON summary of every template
- [API docs](${origin}/docs): interactive reference

## Templates

${templates
	.map((template) => `- [${template.name}](${origin}/t/${template.id}): ${template.description || 'No description'}`)
	.join('\n')}
`;

	return new Response(body, {
		headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' },
	});
};
