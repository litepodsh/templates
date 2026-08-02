import { describe, expect, test } from 'bun:test';
import {
	SEARCH_BAN_WINDOW_MS,
	DEFAULT_SEARCH_RATE_LIMIT_ALLOWLIST,
	SEARCH_RATE_LIMIT,
	SEARCH_RATE_WINDOW_MS,
	SearchRateLimiter,
	clientAddress,
	isSearchRateLimitAllowlisted,
	parseAllowlist,
} from '../src/lib/server/search-rate-limit';

describe('SearchRateLimiter', () => {
	test('limits each client to 250 searches in a rolling minute', () => {
		const limiter = new SearchRateLimiter();
		const now = 1_000_000;

		for (let index = 0; index < SEARCH_RATE_LIMIT; index += 1) {
			expect(limiter.consume('api', '203.0.113.10', now)).toEqual({
				allowed: true,
				remaining: SEARCH_RATE_LIMIT - index - 1,
			});
		}

		expect(limiter.consume('api', '203.0.113.10', now)).toEqual({
			allowed: false,
			retryAfterSeconds: 300,
		});
		expect(limiter.consume('api', '203.0.113.10', now + 1_000)).toEqual({
			allowed: false,
			retryAfterSeconds: 299,
		});
		expect(limiter.consume('api', '203.0.113.10', now + SEARCH_BAN_WINDOW_MS)).toMatchObject({
			allowed: true,
		});
	});

	test('expires a search window and isolates clients and surfaces', () => {
		const limiter = new SearchRateLimiter();
		const now = 1_000_000;

		for (let index = 0; index < SEARCH_RATE_LIMIT; index += 1) {
			limiter.consume('api', '203.0.113.10', now);
		}

		expect(limiter.consume('api', '203.0.113.11', now)).toMatchObject({ allowed: true });
		expect(limiter.consume('ui', '203.0.113.10', now)).toMatchObject({ allowed: true });
		expect(limiter.consume('api', '203.0.113.10', now + SEARCH_RATE_WINDOW_MS)).toMatchObject({
			allowed: true,
		});
	});

	test('uses the original client address forwarded by the trusted proxy', () => {
		const request = new Request('http://localhost', {
			headers: { 'x-forwarded-for': '203.0.113.20, 10.0.0.1' },
		});
		expect(clientAddress({ request, getClientAddress: () => '127.0.0.1' })).toBe('203.0.113.20');
		expect(clientAddress({ request: new Request('http://localhost'), getClientAddress: () => '127.0.0.1' })).toBe(
			'127.0.0.1',
		);
	});

	test('allows configured client IPs and Origin hostnames', () => {
		const entries = parseAllowlist('203.0.113.20, app.example.com');
		const originRequest = new Request('http://localhost', { headers: { origin: 'https://app.example.com' } });

		expect(isSearchRateLimitAllowlisted({ request: new Request('http://localhost') }, '203.0.113.20', entries)).toBe(
			true,
		);
		expect(isSearchRateLimitAllowlisted({ request: originRequest }, '203.0.113.21', entries)).toBe(true);
		expect(isSearchRateLimitAllowlisted({ request: originRequest }, '203.0.113.22', parseAllowlist())).toBe(false);
	});

	test('includes the Rootsh IP and domain in the default allowlist', () => {
		expect(DEFAULT_SEARCH_RATE_LIMIT_ALLOWLIST).toEqual(['216.250.119.183', 'litepod.sh']);
		expect(isSearchRateLimitAllowlisted({ request: new Request('http://localhost') }, '216.250.119.183')).toBe(
			true,
		);
		expect(
			isSearchRateLimitAllowlisted(
				{ request: new Request('http://localhost', { headers: { origin: 'https://litepod.sh' } }) },
				'203.0.113.22',
			),
		).toBe(true);
	});
});
