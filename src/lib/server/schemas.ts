import * as z from 'zod';

export const templatePortSchema = z.object({
	container: z.number().int(),
	description: z.string().optional(),
	primary: z.boolean().optional(),
});

export const templateIconSchema = z.object({
	path: z.string(),
	contentType: z.string().optional(),
});

export const templateFileSchema = z.object({
	filename: z.string(),
	content: z.string(),
});

export const templateFileEncodedSchema = z.object({
	filename: z.string(),
	encoding: z.literal('base64'),
	content: z.string(),
});

export const templateSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	version: z.string(),
	appVersion: z.string().optional(),
	categories: z.array(z.string()),
	tags: z.array(z.string()),
	icon: templateIconSchema.nullable(),
	website: z.string().optional(),
	docs: z.string().optional(),
	source: z.string().optional(),
	license: z.string().optional(),
	ports: z.array(templatePortSchema),
	ui: z.string(),
});

export const templateDetailSchema = templateSummarySchema.extend({
	manifest: templateFileEncodedSchema,
	compose: templateFileEncodedSchema,
	env: templateFileEncodedSchema.nullable(),
	setup: templateFileEncodedSchema.nullable(),
});

export const healthSchema = z.object({
	service: z.string(),
	cache: z.enum(['ok', 'unavailable']),
});

export const versionSchema = z.object({
	name: z.string(),
	version: z.string(),
});

export const errorSchema = z.object({
	error: z.string(),
	data: z.null(),
});

export function envelope<T extends z.ZodTypeAny>(dataSchema: T) {
	return z.object({ error: z.null(), data: dataSchema });
}

export const listTemplatesQuerySchema = z.object({
	q: z.string().optional(),
	category: z.array(z.string()).optional(),
	limit: z.number().int().min(1).max(100).optional(),
});

export type TemplatePort = z.infer<typeof templatePortSchema>;
export type TemplateIcon = z.infer<typeof templateIconSchema>;
export type TemplateFile = z.infer<typeof templateFileSchema>;
export type TemplateSummary = z.infer<typeof templateSummarySchema>;
export type TemplateDetail = z.infer<typeof templateDetailSchema>;
