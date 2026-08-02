import * as z from 'zod';
import { envelope as envelopeSchema } from '$lib/server/schemas';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type ParamDef = {
	name: string;
	in: 'path' | 'query';
	required: boolean;
	description?: string;
	example?: unknown;
	schema: Record<string, unknown>;
};

type ResponseDef = {
	description: string;
	schema: z.ZodTypeAny;
	headers?: Record<string, unknown>;
	contentType?: string;
	contentTypes?: string[];
	noContent?: boolean;
};

type RouteDef = {
	method: HttpMethod;
	path: string;
	summary: string;
	description?: string;
	tags: string[];
	operationId: string;
	params?: ParamDef[];
	responses: Record<string, ResponseDef>;
};

const routes: RouteDef[] = [];

export function register(route: RouteDef): void {
	routes.push(route);
}

function defType(schema: z.ZodTypeAny): string | undefined {
	return (schema as any)._zod?.def?.type;
}

function innerOf(schema: z.ZodTypeAny): z.ZodTypeAny {
	return (schema as any)._zod?.def?.innerType ?? schema;
}

function resolveDef(schema: z.ZodTypeAny): z.ZodTypeAny {
	let s = schema;
	while (true) {
		const t = defType(s);
		if (t === 'optional' || t === 'nullable' || t === 'default') {
			s = innerOf(s);
		} else {
			return s;
		}
	}
}

function isOptional(schema: z.ZodTypeAny): boolean {
	let s = schema;
	while (true) {
		const t = defType(s);
		if (t === 'optional') return true;
		if (t === 'nullable' || t === 'default') {
			s = innerOf(s);
		} else {
			return false;
		}
	}
}

function isNullable(schema: z.ZodTypeAny): boolean {
	let s = schema;
	while (true) {
		const t = defType(s);
		if (t === 'nullable') return true;
		if (t === 'optional' || t === 'default') {
			s = innerOf(s);
		} else {
			return false;
		}
	}
}

export function zodToOpenApiSchema(schema: z.ZodTypeAny): Record<string, unknown> {
	const resolved = resolveDef(schema);
	const nullable = isNullable(schema);
	const def = (resolved as any)._zod?.def;
	const base = zodToOpenApiSchemaInner(resolved, def);

	if (nullable) {
		return { anyOf: [base, { type: 'null' }] };
	}
	return base;
}

function zodToOpenApiSchemaInner(schema: z.ZodTypeAny, def: any): Record<string, unknown> {
	const type = def?.type;
	switch (type) {
		case 'string':
			return { type: 'string' };
		case 'number': {
			const isInt = def.checks?.some?.((c: any) => c.isInt === true);
			return isInt ? { type: 'integer' } : { type: 'number' };
		}
		case 'boolean':
			return { type: 'boolean' };
		case 'literal':
			return { type: typeof def.values?.[0], enum: def.values };
		case 'enum':
			return { type: 'string', enum: Object.values(def.entries ?? {}) };
		case 'array':
			return { type: 'array', items: zodToOpenApiSchema(def.element as z.ZodTypeAny) };
		case 'object': {
			const shape = def.shape as Record<string, z.ZodTypeAny> | undefined;
			if (!shape) return { type: 'object' };
			const required: string[] = [];
			const properties: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(shape)) {
				if (!isOptional(value)) required.push(key);
				properties[key] = zodToOpenApiSchema(value);
			}
			return { type: 'object', required, properties };
		}
		default:
			return {};
	}
}

function paramsToOpenApi(params: ParamDef[]) {
	return params.map((p) => ({
		name: p.name,
		in: p.in,
		required: p.required,
		description: p.description,
		example: p.example,
		schema: p.schema,
		...(p.in === 'query' && (p.schema as any).type === 'array' ? { style: 'form', explode: true } : {}),
	}));
}

function addEnvelope(responseSchema: z.ZodTypeAny): Record<string, unknown> {
	const env = envelopeSchema(responseSchema);
	return zodToOpenApiSchema(env);
}

export function buildDocument(origin: string) {
	const paths: Record<string, Record<string, unknown>> = {};

	for (const route of routes) {
		const methodKey = route.method.toLowerCase();
		const responses: Record<string, unknown> = {};

		for (const [status, def] of Object.entries(route.responses)) {
			const response: Record<string, unknown> = {
				description: def.description,
			};

			if (def.headers) response.headers = def.headers;

			if (def.noContent) {
				// no body
			} else if (def.contentTypes) {
				const content: Record<string, unknown> = {};
				for (const ct of def.contentTypes) {
					content[ct] = { schema: { type: 'string', format: 'binary' } };
				}
				response.content = content;
			} else if (def.contentType && !def.contentType.startsWith('application/json')) {
				response.content = {
					[def.contentType]: { schema: { type: 'string', format: 'binary' } },
				};
			} else {
				response.content = {
					'application/json': { schema: addEnvelope(def.schema) },
				};
			}

			responses[status] = response;
		}

		const operation: Record<string, unknown> = {
			tags: route.tags,
			summary: route.summary,
			operationId: route.operationId,
			responses,
		};

		if (route.description) operation.description = route.description;
		if (route.params?.length) operation.parameters = paramsToOpenApi(route.params);

		paths[route.path] ??= {};
		(paths[route.path] as Record<string, unknown>)[methodKey] = operation;
	}

	return {
		openapi: '3.1.0',
		info: {
			title: 'Templates catalog API',
			version: '1.0.0',
			description:
				'Read-only catalog of self-hostable app templates. Each template is a folder holding a compose file, an env file, an icon and a `template.toml` manifest.',
			license: { name: 'MIT' },
		},
		servers: [{ url: origin }],
		tags: [
			{ name: 'templates', description: 'Catalog reads' },
			{ name: 'health', description: 'Service health' },
			{ name: 'system', description: 'System info' },
		],
		paths,
	};
}
