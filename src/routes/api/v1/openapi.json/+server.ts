import { json } from '@sveltejs/kit';
import { buildDocument } from '$lib/server/openapi-registry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => json(buildDocument(url.origin));
