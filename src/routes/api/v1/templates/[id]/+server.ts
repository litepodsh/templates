import { getTemplate, templatesUsingDomainMarkers, templatesUsingHostNetwork } from '$lib/server/catalog';
import { supportsDomainMarkers } from '$lib/server/domain-markers';
import { supportsHostNetwork } from '$lib/server/host-network';
import { fail, ok } from '$lib/server/response';
import { templateDetailSchema } from '$lib/server/schemas';
import { register } from '$lib/server/openapi-registry';
import type { TemplateFile } from '$lib/types';
import type { RequestHandler } from './$types';

register({
	method: 'GET',
	path: '/api/v1/templates/{id}',
	summary: 'Get one template',
	description:
		'Same fields as the list entry, plus the manifest, compose and env file contents (base64).',
	tags: ['templates'],
	operationId: 'getTemplate',
	params: [
		{
			name: 'id',
			in: 'path',
			required: true,
			description: 'Template id — the folder name under the catalog directory.',
			schema: { type: 'string' },
			example: 'mailpit',
		},
		{
			name: 'features',
			in: 'query',
			required: false,
			description: 'Client capabilities, comma-separated. Without `domain-markers`, templates whose env uses `{{url}}`/`{{domain}}` markers return 404; without `host-network`, templates whose Compose runs a service with `network_mode: host` do too.',
			schema: { type: 'string' },
			example: 'domain-markers,host-network',
		},
	],
	responses: {
		'200': { description: 'The template', schema: templateDetailSchema },
		'404': { description: 'Not found', schema: templateDetailSchema },
	},
});

function encode(file: TemplateFile) {
	return {
		filename: file.filename,
		encoding: 'base64' as const,
		content: Buffer.from(file.content, 'utf8').toString('base64'),
	};
}

export const GET: RequestHandler = async ({ params, url }) => {
	const template = await getTemplate(params.id);
	if (!template) return fail(404, `Template "${params.id}" not found`);
	// Older LitePod installs would pass `{{url}}` to the container literally,
	// and they attach a host-networked service to a proxy network Compose
	// rejects. Hide each kind from the installs that cannot handle it.
	const hidden =
		(!supportsDomainMarkers(url) && (await templatesUsingDomainMarkers()).has(template.id)) ||
		(!supportsHostNetwork(url) && (await templatesUsingHostNetwork()).has(template.id));
	if (hidden) {
		return fail(404, `Template "${template.id}" not found`);
	}

	return ok({
		...template,
		manifest: encode(template.manifest),
		compose: encode(template.compose),
		env: template.env ? encode(template.env) : null,
		setup: template.setup ? encode(template.setup) : null,
	});
};
