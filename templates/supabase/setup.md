## Postgres 17

The `db` service runs Postgres 17. Earlier revisions of this template shipped
Postgres 15, and a `supabase_db_data` volume initialised by 15 will not start
under 17. Wipe the volumes before bringing this version up:

```sh
podman compose -f templates/supabase/compose.yml down -v
```

## Before first boot

This stack shares its secrets across every service. Replace these in `.env`
**before** bringing it up in anything reachable from a network:

- `POSTGRES_PASSWORD` — Postgres superuser; also applied to `authenticator`,
  `supabase_auth_admin`, `supabase_storage_admin` and friends by the init scripts
- `JWT_SECRET` — must be **32+ random characters**; rotate after leaks
- `SECRET_KEY_BASE` — Phoenix signing salt for Realtime; **64+ characters**
- `PG_META_CRYPTO_KEY` — encrypts the connection strings postgres-meta stores
- `REALTIME_DB_ENC_KEY` — encrypts Realtime's tenant records
- `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` — Kong admin UI
- `ANON_KEY` / `SERVICE_ROLE_KEY` — must be JWTs signed with `JWT_SECRET`

Generate the keys with the Supabase CLI:

```sh
brew install supabase/tap/supabase    # or see https://github.com/supabase/cli
supabase start --workdir .            # prints anon + service_role keys
```

Without the CLI, build two HS256 JWTs by hand (`role: "anon"` and
`role: "service_role"`) against `JWT_SECRET` and paste them into `.env`.

## URLs

Update to match the host you'll expose Supabase on:

```toml
SITE_URL              = "https://app.example.com"
API_EXTERNAL_URL      = "https://api.example.com"
SUPABASE_PUBLIC_URL   = "https://api.example.com"
```

`SITE_URL` is where GoTrue redirects after email links; `SUPABASE_PUBLIC_URL`
is the base clients see. They can differ (e.g. dashboard on `app.`, API on
`api.`) but must be reachable. `API_EXTERNAL_URL` doubles as the JWT issuer.

## Mail (SMTP)

By default the stack points at the `mailpit` service in this catalog on the
`mailpit` network. If you didn't start it alongside Supabase, change:

```toml
SMTP_HOST = "mailpit"
SMTP_PORT = "1025"
```

to your real relay, and set `SMTP_USER` / `SMTP_PASS` / `SMTP_ADMIN_EMAIL`
accordingly. With no SMTP at all, set `ENABLE_EMAIL_AUTOCONFIRM=true` so
sign-ups are marked verified without a confirmation mail.

## First boot

```sh
podman compose -f templates/supabase/compose.yml \
  --env-file templates/supabase/.env up -d
podman compose -f templates/supabase/compose.yml logs -f db
```

The `db` container does a one-time init the first time it writes to
`supabase_db_data`: it applies the role passwords, the JWT settings, the
`_realtime` schema and the Database Webhooks schema, all shipped inline in
`compose.yml` as compose configs. Wait for `database system is ready to accept
connections` before opening Studio. Endpoints:

- **Studio**: <http://localhost:3000>
- **REST/Auth/Realtime/Storage/Functions**: <http://localhost:8000>
- **Postgres** (direct): `localhost:5432`, password from `POSTGRES_PASSWORD`

## Edge Functions

`compose.yml` ships only the `main` dispatcher, which verifies the JWT and
forwards `/functions/v1/<name>` to `/home/deno/functions/<name>`. To deploy your
own functions, mount them into that path — e.g. add a named volume to the
`functions` service and populate it, or bake them into a derived image. Set
`FUNCTIONS_VERIFY_JWT=false` to accept unauthenticated calls.

## OAuth (optional)

Set `ENABLE_GOOGLE_SIGNIN=true` (or GitHub) and fill the matching
`*_CLIENT_ID` / `*_CLIENT_SECRET`. The callback URL GoTrue expects is
`${SUPABASE_PUBLIC_URL}/auth/v1/callback` — register that exact value with
the provider, including the scheme.

## Not included

Upstream's compose also ships Supavisor (connection pooler) and Logflare +
Vector (Logs & Analytics). Both are opt-in there too, and this template leaves
them out; `ENABLED_FEATURES_LOGS_ALL` is off in Studio to match. Clients connect
straight to Postgres on `DB_PORT`.

## Reset

All state lives in named volumes:

```sh
podman compose -f templates/supabase/compose.yml down -v
```
