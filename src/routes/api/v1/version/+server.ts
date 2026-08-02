import { APP_NAME, APP_VERSION } from '$lib/app-info';
import { ok } from '$lib/server/response';
import { versionSchema } from '$lib/server/schemas';
import { register } from '$lib/server/openapi-registry';
import type { RequestHandler } from './$types';

register({
	method: 'GET',
	path: '/api/v1/version',
	summary: 'Get app version',
	tags: ['system'],
	operationId: 'getVersion',
	responses: {
		'200': {
			description: 'App name and version',
			schema: versionSchema,
		},
	},
});

export const GET: RequestHandler = () => {
	return ok({ name: APP_NAME, version: APP_VERSION });
};
