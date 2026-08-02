import { json } from '@sveltejs/kit';

/**
 * LitePod's Rust API answers every request with `{ error, data }`
 * (`api/src/dtos/response.rs`). Matching that envelope here means its existing
 * client conventions carry over to this service unchanged.
 */
export type ApiResponse<T> = {
	error: string | null;
	data: T | null;
};

export function ok<T>(data: T, init?: ResponseInit): Response {
	return json({ error: null, data } satisfies ApiResponse<T>, init);
}

export function fail(status: number, message: string, init?: ResponseInit): Response {
	return json({ error: message, data: null } satisfies ApiResponse<never>, { ...init, status });
}
