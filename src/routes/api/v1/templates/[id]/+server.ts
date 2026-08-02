import { getTemplate } from '$lib/server/catalog';
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

export const GET: RequestHandler = async ({ params }) => {
	const template = await getTemplate(params.id);
	if (!template) return fail(404, `Template "${params.id}" not found`);

	return ok({
		...template,
		manifest: encode(template.manifest),
		compose: encode(template.compose),
		env: template.env ? encode(template.env) : null,
		setup: template.setup ? encode(template.setup) : null,
	});
};
