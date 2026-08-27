# What this template runs

The Formbricks web app, a PostgreSQL database with the `pgvector` extension
(`pgvector/pgvector:pg18`), Redis, and a one-shot `formbricks-migrate` job that
applies database migrations before the app starts (`SKIP_STARTUP_MIGRATION` is
`true` on the app so it does not race the job).

## Not included: Cube.js + Formbricks Hub

Formbricks v5's baseline `docker/docker-compose.yml` also ships **Cube.js** and
**Formbricks Hub** for the analytics dashboards, and mounts model files from the
repository. Those bind-mounted files don't fit this catalog's rules, so they are
left out here. Survey creation, responses, integrations and email work; the
newer analytics views need the upstream compose.

## Before deploying

- `FORMBRICKS_WEBAPP_URL` — the real external origin; embeds and auth redirects
  are built from it.
- `FORMBRICKS_NEXTAUTH_SECRET`, `FORMBRICKS_ENCRYPTION_KEY` (32-char hex),
  `FORMBRICKS_CRON_SECRET` — replace all three.
- Without SMTP, keep `FORMBRICKS_EMAIL_VERIFICATION_DISABLED=1` so the first
  account can sign in. The first registered user becomes the instance owner.
