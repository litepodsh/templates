import { readFileSync } from 'node:fs';
import { createClient, type RedisClientType } from 'redis';

type DragonflyClient = RedisClientType;

const RETRY_DELAY_MS = 30_000;

let client: DragonflyClient | null = null;
let connecting: Promise<DragonflyClient | null> | null = null;
let retryAfter = 0;

/**
 * Returns the shared Dragonfly client. A short retry delay keeps a temporarily
 * unavailable cache or limiter from delaying every request.
 */
export async function getDragonfly(): Promise<DragonflyClient | null> {
	if (client?.isReady) return client;
	if (connecting) return connecting;
	if (Date.now() < retryAfter) return null;

	const url = readSetting('DRAGONFLY_URL');
	if (!url) return null;

	connecting = connect(url);
	try {
		return await connecting;
	} finally {
		connecting = null;
	}
}

/**
 * Validates the cache at startup and logs the outcome, so a missing or broken
 * cache is visible in the logs before the first request is handled. Called from
 * `hooks.server.ts`.
 */
export async function validateCache(): Promise<void> {
	const redis = await getDragonfly();
	if (!redis) {
		// `connect()` already logs the specific failure reason when a connection
		// was attempted; log here only when no cache is configured at all.
		if (!readSetting('DRAGONFLY_URL')) {
			console.warn('[dragonfly] cache not configured (DRAGONFLY_URL missing); using local fallback');
		}
		return;
	}

	try {
		await redis.ping();
		console.log('[dragonfly] cache ready');
	} catch (error) {
		markUnavailable(redis);
		console.error(`[dragonfly] cache check failed: ${messageOf(error)}`);
	}
}

/** Executes an operation against Dragonfly and degrades gracefully on outage. */
export async function withDragonfly<T>(operation: (redis: DragonflyClient) => Promise<T>): Promise<T | null> {
	const redis = await getDragonfly();
	if (!redis) return null;

	try {
		return await operation(redis);
	} catch (error) {
		markUnavailable(redis);
		console.warn(`[dragonfly] request failed; using local fallback: ${messageOf(error)}`);
		return null;
	}
}

async function connect(url: string): Promise<DragonflyClient | null> {
	let candidate: DragonflyClient | undefined;
	try {
		// `createClient` parses the URL synchronously and throws on a malformed
		// one (e.g. missing `@` before the host) — keep it inside the try too.
		candidate = createClient({
			url: normalizeRedisUrl(url),
			socket: { connectTimeout: 2_000, reconnectStrategy: false },
		});
		// node-redis requires an error listener even though connection failures are
		// handled below and requests have a local fallback.
		candidate.on('error', () => undefined);

		await candidate.connect();
		client = candidate;
		return candidate;
	} catch (error) {
		retryAfter = Date.now() + RETRY_DELAY_MS;
		if (candidate?.isOpen) candidate.destroy();
		console.warn(`[dragonfly] unavailable; using local fallback: ${messageOf(error)}`);
		return null;
	}
}

/**
 * Redis URLs use URL encoding for credentials. Accept a literal percent sign
 * in a password from .env too, since it is easy to paste a Dragonfly password
 * that way and node-redis otherwise rejects the entire URL.
 */
function normalizeRedisUrl(url: string): string {
	const schemeEnd = url.indexOf('://');
	const authStart = schemeEnd === -1 ? -1 : schemeEnd + 3;
	const authEnd = url.lastIndexOf('@');
	if (authStart < 0 || authEnd <= authStart) return url;

	const credentials = url.slice(authStart, authEnd);
	const passwordStart = credentials.indexOf(':');
	if (passwordStart === -1) return url;

	const password = credentials.slice(passwordStart + 1).replace(/%(?![0-9a-fA-F]{2})/g, '%25');
	return `${url.slice(0, authStart)}${credentials.slice(0, passwordStart + 1)}${password}${url.slice(authEnd)}`;
}

function markUnavailable(redis: DragonflyClient): void {
	if (client === redis) client = null;
	retryAfter = Date.now() + RETRY_DELAY_MS;
	if (redis.isOpen) redis.destroy();
}

/** Process env wins; adapter-node also supports a local .env at runtime. */
function readSetting(name: string): string | undefined {
	if (process.env[name] !== undefined) return process.env[name];

	try {
		const expression = new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`);
		const line = readFileSync('.env', 'utf8').split(/\r?\n/).find((entry) => expression.test(entry));
		if (!line) return undefined;

		const value = line.replace(expression, '').trim();
		return value.replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '');
	} catch {
		return undefined;
	}
}

function messageOf(error: unknown): string {
	return error instanceof Error ? error.message : 'unknown error';
}
