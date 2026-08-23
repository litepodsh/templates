import { validateCache } from '$lib/server/dragonfly';
import { logSearchRateLimitAllowlist } from '$lib/server/search-rate-limit';

const routeModules = import.meta.glob('./routes/api/v1/**/+server.ts', { eager: true });

/** Logs runtime configuration and validates the cache once, before the server handles requests. */
export const init = () => {
	logSearchRateLimitAllowlist();
	void validateCache();
};
