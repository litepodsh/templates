import { logSearchRateLimitAllowlist } from '$lib/server/search-rate-limit';

const routeModules = import.meta.glob('./routes/api/v1/**/+server.ts', { eager: true });

/** Logs runtime search-limit configuration once, before the server handles requests. */
export const init = () => {
	logSearchRateLimitAllowlist();
};
