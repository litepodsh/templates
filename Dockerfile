# syntax=docker/dockerfile:1

# ---- deps: full install (incl. devDependencies) for the build step ----
FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- build: compile the SvelteKit app (adapter-node -> build/) ----
FROM deps AS build
COPY . .
RUN bun run build

# ---- runtime: production deps + build output + catalog content ----
FROM oven/bun:latest AS runtime
WORKDIR /app
ENV NODE_ENV=production

# adapter-node's output isn't fully bundled: packages under "dependencies"
# in package.json stay external and must be present as node_modules here.
# devDependencies (svelte, vite, svelte-kit, ...) already did their job in
# the build stage, so this install skips them.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/build ./build

# templates/ is read from disk at runtime (src/lib/server/catalog.ts), not
# bundled into build/ — it has to ship next to the server or the catalog is
# empty. Baked in here for a self-contained image; to serve a different set
# without rebuilding, bind-mount over /app/templates and/or set TEMPLATES_DIR.
COPY templates ./templates

USER bun

EXPOSE 3000
ENV PORT=3000 HOST=0.0.0.0

# Optional runtime config (see README.md "Configuration"), pass with `-e`:
#   DOMAIN                        public origin baked into API responses
#   SEARCH_RATE_LIMIT_ALLOWLIST   extra IPs/origins exempt from search limits
#   DRAGONFLY_URL                 Redis-compatible cache/rate-limiter;
#                                 the app degrades gracefully without it
#   TEMPLATES_DIR                 override if templates/ is mounted elsewhere

CMD ["bun", "build/index.js"]
