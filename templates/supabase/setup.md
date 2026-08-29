## Included services

This minimal template includes Postgres, Kong, Auth, REST, Postgres Meta, and
Studio. It intentionally excludes Storage, Realtime, Edge Functions, Imgproxy,
Webhooks, analytics, and the connection pooler.

## Before boot

Replace all placeholder secrets in `.env`, especially `POSTGRES_PASSWORD`,
`JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, and `PG_META_CRYPTO_KEY`.
The anon and service-role keys must be valid JWTs signed with `JWT_SECRET`.

Set `SITE_URL`, `API_EXTERNAL_URL`, and `SUPABASE_PUBLIC_URL` to your public
domains. Configure SMTP or set `ENABLE_EMAIL_AUTOCONFIRM=true` for testing.

## Litepod

Kong is exposed internally on port 8000. Attach the Litepod application domain
to that service/port; Litepod's proxy handles public HTTP and HTTPS, so this
template does not publish host ports. Studio is available internally on 3000
for a separate dashboard route if your deployment config exposes it.

## Recovery

`db-bootstrap` assigns the internal Supabase role passwords and JWT settings
after Postgres becomes healthy. It is safe to rerun against an existing volume.
If the database is disposable, reset all state with:

```sh
podman compose -f templates/supabase/compose.yml down -v
```
