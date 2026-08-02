import { getDragonfly } from '$lib/server/dragonfly';
import { ok } from '$lib/server/response';
import { healthSchema } from '$lib/server/schemas';
import { register } from '$lib/server/openapi-registry';
import type { RequestHandler } from './$types';

register({
	method: 'GET',
	path: '/api/v1/health',
	summary: 'Service health check',
	description: 'Returns service and cache (Dragonfly) status. Useful for readiness probes and monitoring.',
	tags: ['health'],
	operationId: 'getHealth',
	responses: {
		'200': {
			description: 'Health status',
			schema: healthSchema,
		},
	},
});

export const GET: RequestHandler = async () => {
	const dragonfly = await getDragonfly();

	return ok({
		service: 'ok',
		cache: dragonfly?.isReady ? 'ok' : 'unavailable',
	});
};
