## What this is

Cap is a self-hosted, privacy-first CAPTCHA. Instead of puzzles or click-the-
traffic-lights, the visitor's browser silently solves proof-of-work and
instrumentation challenges. The server verifies the result cheaply and issues a
token your backend checks on submit.

This template runs the Cap **standalone** server plus a bundled **Valkey**
(Redis-compatible) store for sessions, API keys and challenge state.

## Before first boot

Cap refuses to start without an admin key of at least 12 characters. LitePod
replaces the `{{password_32}}` placeholder with a random value on deploy, so the
template works immediately. If you run it standalone, set `CAP_ADMIN_KEY`
yourself.

- `CAP_ADMIN_KEY` — the key used to sign into the dashboard and the API.
  Keep it secret; anyone with it can manage site keys, settings and tokens.
- `CAP_PORT` — the host port for the web UI and API. Inside the Compose
  network Cap always listens on `3000`; litepod domains use that internal port,
  not this host mapping.

## First boot

Run the template locally with Podman Compose:

```sh
podman compose -f templates/cap/compose.yml \
  --env-file templates/cap/.env up -d
```

Open <http://localhost:3000>. The dashboard shows a login page; sign in with
`CAP_ADMIN_KEY`. Liveness is at `/health/live` and readiness (includes a Valkey
ping) at `/health`, both unauthenticated.

## Creating a site key and integrating

From the dashboard, create a site key and copy the widget snippet into the page
you want to protect. On submit, your backend verifies the token against Cap's
`/siteverify` endpoint. See the [Cap standalone
guide](https://trycap.dev/guide/standalone/) for the exact snippet and API
reference.

If you want to restrict which origins may call Cap, set `CORS_ORIGIN` in the
environment to a comma-separated list of allowed origins; otherwise Cap accepts
requests from any origin by default.

## Public domain in litepod

After creating this template through litepod:

1. In the application's **Connectivity** section, add a Caddy HTTP/HTTPS route
   for your domain and select service `cap` with internal port `3000`.
2. Deploy or redeploy when litepod marks the application configuration stale.

litepod connects catalog-created Compose services to its shared
`litepod-network`, so Caddy reaches Cap without a public host-port mapping. The
source `compose.yml` intentionally does not declare that external network, so
the template also works with plain local Podman Compose.

## Data and reset

Valkey persists sessions, site keys and settings in the `valkey_data` named
volume. Cap itself keeps no filesystem state. Stop and remove everything with:

```sh
podman compose -f templates/cap/compose.yml down -v
```
