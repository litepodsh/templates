# Templates

Catalog service for self-hostable app templates, consumed by [LitePod](https://github.com/sebasgc/litepod).

A template is a folder: a compose file, an env file, an icon and a `template.toml` manifest.
No code, no build step — drop a folder in `templates/` and it shows up.

This repo serves that catalog two ways:

- a browsable UI (SvelteKit + shadcn-svelte) at `/`
- a read-only REST API under `/api/v1`, with Scalar docs at `/docs`

## Running it

```sh
just dev       # dev server on :5173
just check     # svelte-check
just build     # production build (adapter-node -> build/)
just preview   # build, then run build/index.js on :3000
```

`bun` only — never `npm`/`yarn`.

## Adding a template

```
templates/
└── mailpit/
    ├── template.toml
    ├── compose.yml
    ├── .env
    └── logo.svg
```

The folder name is the template id and must match `[a-z0-9][a-z0-9._-]*`. A folder with no
`template.toml`, or one whose `[template].id` disagrees with the folder name, is skipped with a
warning rather than breaking the catalog.

In dev the catalog is re-scanned per request, so a new template needs a page refresh, not a restart.

### `template.toml`

```toml
[template]
id          = "mailpit"          # must equal the folder name
name        = "Mailpit"
description = "Email & SMTP testing tool with a web UI."
version     = "1.27"
categories  = ["email", "developer-tools"]
tags        = ["smtp", "testing"]
icon        = "logo.svg"         # optional; falls back to any logo.* in the folder
website     = "https://mailpit.axllent.org"
docs        = "https://mailpit.axllent.org/docs/"
source      = "https://github.com/axllent/mailpit"
license     = "MIT"

# Optional — these are the defaults.
[files]
compose = "compose.yml"
env     = ".env"
setup   = "setup.md"            # sanitised markdown; rendered above the file tabs

[[ports]]
container   = 8025
description = "Web UI"
primary     = true
```

Only `[template].id` and `[template].name` are required; everything else has a default.

`icon` may be a local `.webp`, `.png`, `.jpg`, `.jpeg` or `.svg` filename (such as `logo.svg`), or
an absolute `http(s)` image URL. Omit it to fall back to `logo.*` in the template folder.

### Compose conventions

Templates target **Podman**, so:

- fully qualify images (`docker.io/axllent/mailpit:v1.27`) — Podman has no implicit registry
  unless `unqualified-search-registries` is configured
- prefer named volumes over bind mounts so they work rootless
- put every tunable in `.env` and reference it as `${VAR}` in the compose file

Verify a template actually runs before committing it:

```sh
podman compose -f templates/mailpit/compose.yml --env-file templates/mailpit/.env up -d
podman compose -f templates/mailpit/compose.yml down -v
```

> Template `.env` files are catalog content, not secrets. `.gitignore` carries a
> `!templates/**/.env` negation so they stay tracked — don't remove it.

## API

| Method | Route | Returns |
| ------ | ----- | ------- |
| `GET` | `/api/v1/templates` | every template sorted by name, or a relevance-ordered search |
| `GET` | `/api/v1/templates/{id}` | one template, plus manifest/compose/env contents (base64) |
| `GET` | `/api/v1/templates/{id}/icon` | raw image bytes (ETag, `nosniff`, locked-down CSP) |
| `GET` | `/api/v1/openapi.json` | the OpenAPI 3.1 document |
| `GET` | `/docs` | Scalar reference UI |

Responses use `{ "error": string | null, "data": T | null }` — the same envelope as LitePod's Rust API,
so its client conventions carry over unchanged.

File contents (`manifest`, `compose`, `env`) are **base64-encoded UTF-8**, tagged with
`"encoding": "base64"`, so tabs, CRLF and quoting survive byte-exact:

```sh
curl -s localhost:5173/api/v1/templates | jq
curl -s localhost:5173/api/v1/templates/mailpit | jq -r '.data.compose.content' | base64 -d
```

### Search

Search is a query param on the listing endpoint, not a `/templates/search` route — a static
`search` segment would shadow `/templates/{id}` and make a template whose folder is named
`search` unreachable.

| Param | Default | Meaning |
| ----- | ------- | ------- |
| `q` | — | fuzzy term, matched against name, tags, categories, description and id |
| `category` | — | keep only templates declaring this category; combines with `q` |
| `limit` | — | cap results (1–100), applied after filtering; `422` if out of range |

```sh
curl -s 'localhost:5173/api/v1/templates?q=mailpt' | jq '.data[].id'      # fuzzy, typo-tolerant
curl -s 'localhost:5173/api/v1/templates?category=email&limit=5' | jq
```

Matching is Fuse.js, weighted name > tags > categories > description/id, `threshold: 0.4`. The
config lives in `src/lib/search.ts` and is shared by the endpoint and the UI's remote query, so
the browser and LitePod always rank results identically.

Search requests (`q` or `category`) are limited to **250 per minute per client IP**, separately for
the API and UI. The server uses the first `X-Forwarded-For` address supplied by the trusted reverse
proxy (falling back to the adapter client address). Exceeding the quota blocks searches for that IP
and surface for **5 minutes**. A limited API request returns `429` with the usual error envelope and
a `Retry-After` header. Dragonfly stores this limit so it is shared across replicas, and caches each
search's final result for **two hours**. If Dragonfly is temporarily unavailable, both features fall
back to a per-process limiter and uncached searches until it reconnects.

The UI reads the same catalog through SvelteKit **remote functions**
(`src/lib/templates.remote.ts`), not through these endpoints. The REST routes exist for LitePod;
the remote functions exist for the UI. UI search remains fuzzy and debounced by 200 ms.

## Layout

```
templates/                       catalog content
static/fonts/                    Commit Mono, used by the Monaco viewers
src/lib/server/catalog.ts        scan + parse + cache; the single source of truth
src/lib/server/openapi.ts        hand-maintained OpenAPI document
src/lib/server/response.ts       { error, data } helpers
src/lib/search.ts                Fuse config, shared by the endpoint and the UI
src/lib/templates.remote.ts      remote queries used by the UI
src/lib/types.ts                 shared client-facing types
src/routes/                      catalog (/), detail (/t/[id]), docs (/docs), api (/api/v1)
```

## Configuration

The application reads `SEARCH_RATE_LIMIT_ALLOWLIST` from `.env` at startup (or from the process
environment, which takes precedence). Add comma-separated client IPs and Origin hostnames there; the
effective list is logged once when the server starts. The repository's `.env` contains the initial
values.

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `TEMPLATES_DIR` | `templates` | catalog directory, resolved against `process.cwd()` |
| `DOMAIN` | — | Public origin of the catalog UI (e.g. `https://templates.litepod.sh`). Baked into API responses as each template's `ui` field. Leave empty in dev to return relative URLs. |
| `SEARCH_RATE_LIMIT_ALLOWLIST` | `216.250.119.183,litepod.sh` | Additional comma-separated exact client IPs and `Origin` hostnames exempt from search rate limits, e.g. `203.0.113.10,app.example.com` |
| `DRAGONFLY_URL` | — | Redis-compatible Dragonfly URL for the shared search cache and rate limiter. Required in production for cross-replica behavior. |

## Deploying

`adapter-node` emits `build/`. **`templates/` is read at runtime**, so it has to ship next to the
build output (or `TEMPLATES_DIR` has to point at a mounted volume) — otherwise the catalog is empty
in production.

```sh
bun run build
node build/index.js      # :3000
```
