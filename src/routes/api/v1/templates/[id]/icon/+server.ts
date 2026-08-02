import { readTemplateIcon } from '$lib/server/catalog';
import { fail } from '$lib/server/response';
import * as z from 'zod';
import { register } from '$lib/server/openapi-registry';
import type { RequestHandler } from './$types';

register({
	method: 'GET',
	path: '/api/v1/templates/{id}/icon',
	summary: 'Get a template icon',
	description:
		'Raw image bytes. Served with `nosniff` and a locked-down CSP because SVG is active content.',
	tags: ['templates'],
	operationId: 'getTemplateIcon',
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
		'200': {
			description: 'The icon',
			schema: z.string(),
			contentTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml'],
		},
		'304': {
			description: 'Not modified — the `If-None-Match` ETag still matches.',
			schema: z.string(),
			noContent: true,
		},
		'404': { description: 'Not found', schema: z.string() },
	},
});

export const GET: RequestHandler = async ({ params, request }) => {
	const icon = await readTemplateIcon(params.id);
	if (!icon) return fail(404, `Template "${params.id}" has no icon`);

	if (request.headers.get('if-none-match') === icon.etag) {
		return new Response(null, { status: 304, headers: { etag: icon.etag } });
	}

	return new Response(new Uint8Array(icon.bytes), {
		headers: {
			'content-type': icon.contentType,
			'content-length': String(icon.bytes.byteLength),
			etag: icon.etag,
			'cache-control': 'public, max-age=300',
			'x-content-type-options': 'nosniff',
			'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
		},
	});
};
