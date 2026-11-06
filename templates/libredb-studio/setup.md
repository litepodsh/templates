## What this is

LibreDB Studio is a browser SQL IDE that runs next to the databases it reads.
One container talks to PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, Db2,
SQLite, DuckDB, MongoDB, Redis, ClickHouse, Cassandra, Kafka, Kubernetes and
around thirty more engines, with an object browser, multi-tab editor, ER
diagrams, schema diff and an optional read-only AI agent.

## First boot

```sh
podman compose -f templates/libredb-studio/compose.yml \
  --env-file templates/libredb-studio/.env up -d
```

Open the app's URL and sign in with `LIBREDB_ADMIN_EMAIL` /
`LIBREDB_ADMIN_PASSWORD` from `.env`. With `STORAGE_PROVIDER=sqlite` those
values are only the bootstrap: the first boot copies them into the accounts
table, and every later sign-in reads that table.

## Login over plain HTTP

`LIBREDB_AUTH_COOKIE_SECURE=false` is set on purpose. LitePod serves the app
over `http://` on a generated domain, and a `Secure` session cookie is dropped
by the browser there — the health check stays green while every login lands
back on the login page. Once the app has a domain with TLS, set it to `true`
and redeploy.

## Data

The `libredb_data` volume holds the SQLite store
(`/app/data/libredb-storage.db`): connections, saved queries, audit trail and
the accounts table. Connection passwords and keys are encrypted with a key
derived from `LIBREDB_JWT_SECRET`, so keep that value stable across redeploys —
changing it makes stored credentials unreadable (they are dropped from the
connection, and you re-enter the password once).

Schema snapshots, the seed-connections file and a PostgreSQL-backed store are
optional extras; see the
[LibreDB docs](https://github.com/libredb/libredb-studio/tree/main/docs).

## Optional AI agent (off by default)

The agent is **off by default**: this template configures no model, so no AI
surface appears and no query leaves the container. Configuring a model is the
only opt-in — there is no separate switch. Uncomment the `LIBREDB_LLM_*` block
in `.env` and the matching lines in `compose.yml`, restart, and the agent rail
shows up beside the editor.
Every statement it runs goes through a read-only pipeline, and statements you
type yourself are not part of that pipeline. For Ollama use
`LIBREDB_LLM_PROVIDER=ollama` plus `LIBREDB_LLM_API_URL` pointing at your
Ollama endpoint.

## Connecting to databases in other LitePod apps

Studio runs in its own Compose project, so it cannot reach other apps by
service name. Use the host address those databases are published on, or the
public domain of the database app.

## Reset

```sh
podman compose -f templates/libredb-studio/compose.yml down -v
```
