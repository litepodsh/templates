import { readFileSync } from 'node:fs';
import type { RequestEvent } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { withDragonfly } from '$lib/server/dragonfly';

export const SEARCH_RATE_LIMIT = 250;
export const SEARCH_RATE_WINDOW_MS = 60_000;
export const SEARCH_BAN_WINDOW_MS = 5 * 60_000;

const MAX_CLIENTS = 10_000;
export const DEFAULT_SEARCH_RATE_LIMIT_ALLOWLIST = ['216.250.119.183', 'litepod.sh'] as const;
const allowlist = new Set([
	...DEFAULT_SEARCH_RATE_LIMIT_ALLOWLIST,
	...parseAllowlist(readAllowlistSetting()),
]);

export type SearchSurface = 'api' | 'ui';

export type RateLimitResult =
	| { allowed: true; remaining: number }
	| { allowed: false; retryAfterSeconds: number };

type ClientWindow = {
	bannedUntil: number | null;
	requests: number[];
	updatedAt: number;
};

/** Per-process fallback when Dragonfly is unavailable. */
export class SearchRateLimiter {
	private readonly clients = new Map<string, ClientWindow>();

	consume(surface: SearchSurface, client: string, now = Date.now()): RateLimitResult {
		this.pruneExpired(now);

		const key = `${surface}:${client}`;
		const windowStart = now - SEARCH_RATE_WINDOW_MS;
		const existing = this.clients.get(key);
		if (existing?.bannedUntil && existing.bannedUntil > now) {
			return {
				allowed: false,
				retryAfterSeconds: Math.ceil((existing.bannedUntil - now) / 1_000),
			};
		}

		const requests = existing?.requests.filter((requestedAt) => requestedAt > windowStart) ?? [];

		if (requests.length >= SEARCH_RATE_LIMIT) {
			this.clients.set(key, {
				bannedUntil: now + SEARCH_BAN_WINDOW_MS,
				requests,
				updatedAt: now,
			});
			return { allowed: false, retryAfterSeconds: SEARCH_BAN_WINDOW_MS / 1_000 };
		}

		requests.push(now);
		this.clients.set(key, { bannedUntil: null, requests, updatedAt: now });
		this.enforceCapacity();
		return { allowed: true, remaining: SEARCH_RATE_LIMIT - requests.length };
	}

	private pruneExpired(now: number): void {
		const windowStart = now - SEARCH_RATE_WINDOW_MS;
		for (const [key, client] of this.clients) {
			const requests = client.requests.filter((requestedAt) => requestedAt > windowStart);
			const bannedUntil = client.bannedUntil && client.bannedUntil > now ? client.bannedUntil : null;
			if (requests.length === 0 && !bannedUntil) this.clients.delete(key);
			else this.clients.set(key, { bannedUntil, requests, updatedAt: client.updatedAt });
		}
	}

	private enforceCapacity(): void {
		while (this.clients.size > MAX_CLIENTS) {
			let oldestKey: string | undefined;
			let oldestUpdatedAt = Infinity;
			for (const [key, client] of this.clients) {
				if (client.updatedAt < oldestUpdatedAt) {
					oldestKey = key;
					oldestUpdatedAt = client.updatedAt;
				}
			}
			if (oldestKey === undefined) return;
			this.clients.delete(oldestKey);
		}
	}
}

export const searchRateLimiter = new SearchRateLimiter();

const RATE_LIMIT_SCRIPT = `
local bannedTtl = redis.call('PTTL', KEYS[2])
if bannedTtl > 0 then
  return {0, math.ceil(bannedTtl / 1000)}
end

local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - window)
local count = redis.call('ZCARD', KEYS[1])
if count >= limit then
  redis.call('SET', KEYS[2], '1', 'PX', ARGV[4])
  return {0, math.ceil(tonumber(ARGV[4]) / 1000)}
end

redis.call('ZADD', KEYS[1], now, ARGV[5])
redis.call('PEXPIRE', KEYS[1], window)
return {1, limit - count - 1}
`;

/**
 * Shared Dragonfly limiter. If the dependency is temporarily unavailable, the
 * process-local limiter preserves protection until the next reconnect attempt.
 */
export async function consumeSearchRateLimit(surface: SearchSurface, client: string): Promise<RateLimitResult> {
	const baseKey = `templates:search:rate:v1:${surface}:${client}`;
	const response = await withDragonfly((redis) =>
		redis.eval(RATE_LIMIT_SCRIPT, {
			keys: [`${baseKey}:requests`, `${baseKey}:ban`],
			arguments: [
				String(Date.now()),
				String(SEARCH_RATE_WINDOW_MS),
				String(SEARCH_RATE_LIMIT),
				String(SEARCH_BAN_WINDOW_MS),
				randomUUID(),
			],
		}),
	);

	if (Array.isArray(response) && response.length === 2) {
		const [allowed, value] = response.map(Number);
		if (allowed === 1 && Number.isFinite(value)) return { allowed: true, remaining: value };
		if (allowed === 0 && Number.isFinite(value)) return { allowed: false, retryAfterSeconds: value };
	}

	return searchRateLimiter.consume(surface, client);
}

/** The trusted proxy supplies the left-most (original client) forwarded address. */
export function clientAddress(event: Pick<RequestEvent, 'getClientAddress' | 'request'>): string {
	const forwardedFor = event.request.headers.get('x-forwarded-for');
	const forwardedClient = forwardedFor?.split(',', 1)[0]?.trim();
	return forwardedClient || event.getClientAddress();
}

/**
 * Reads a comma-separated list of exact client IPs and Origin hostnames. Origin
 * hostnames are intended for deployments where the trusted proxy normalises the
 * Origin header before passing requests to this service.
 */
export function parseAllowlist(value: string | undefined): ReadonlySet<string> {
	return new Set(
		value
			?.split(',')
			.map((entry) => entry.trim().toLowerCase())
			.filter(Boolean) ?? [],
	);
}

/**
 * Process environment takes precedence in production. When running `node
 * build/index.js` locally, load just this non-secret setting from `.env` too.
 */
function readAllowlistSetting(): string | undefined {
	if (process.env.SEARCH_RATE_LIMIT_ALLOWLIST !== undefined) {
		return process.env.SEARCH_RATE_LIMIT_ALLOWLIST;
	}

	try {
		const line = readFileSync('.env', 'utf8')
			.split(/\r?\n/)
			.find((entry) => /^\s*(?:export\s+)?SEARCH_RATE_LIMIT_ALLOWLIST\s*=/.test(entry));
		if (!line) return undefined;

		const value = line.replace(/^\s*(?:export\s+)?SEARCH_RATE_LIMIT_ALLOWLIST\s*=\s*/, '').trim();
		return value.replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '');
	} catch {
		return undefined;
	}
}

export function logSearchRateLimitAllowlist(): void {
	console.info(`[search-rate-limit] allowlist: ${[...allowlist].join(', ')}`);
}

export function isSearchRateLimitAllowlisted(
	event: Pick<RequestEvent, 'request'>,
	client: string,
	entries = allowlist,
): boolean {
	if (entries.has(client.toLowerCase())) return true;

	const origin = event.request.headers.get('origin');
	if (!origin) return false;

	try {
		return entries.has(new URL(origin).hostname.toLowerCase());
	} catch {
		return false;
	}
}
