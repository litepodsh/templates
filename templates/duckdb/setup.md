# What this runs

The official `duckdb/duckdb` CLI image (distroless, no shell) serving the
database over the **Quack** remote protocol — DuckDB's official client–server
mechanism, HTTP-based on port **9494**. The database file lives in a named
volume, so data and the installed `quack` extension survive restarts.

> Quack is in beta: the protocol, function names and defaults are still
> subject to change. Pin the image tag in `compose.yml` and bump it
> deliberately.

# Connecting a client

Any DuckDB v1.5.3+ client can talk to the server. Client and server agree on
the token from `DUCKDB_AUTH_TOKEN`:

```sql
-- Attach once, then query remote tables like local ones.
ATTACH 'quack:duckdb' AS remote (
    TOKEN 'your-token'
);
FROM remote.query('SELECT 42');
```

or statelessly:

```sql
FROM quack_query('quack:duckdb', 'SELECT 42', token => 'your-token');
```

`quack:duckdb` resolves over the Compose network. From a host you published
port 9494 on, use `quack:localhost:9494` — local URIs use plain HTTP. The
Quack client negotiates TLS automatically for remote URIs, so once this
service is behind a reverse proxy with a real hostname, `quack:<hostname>`
just works.

# Auth and access

Quack exposes the full SQL surface of the server session — read *and* write.
Default authentication is token-based (the `DUCKDB_AUTH_TOKEN` above) and
default authorization allows everything, so keep it behind a reverse proxy or
VPN. The token is passed to `quack_serve` on every boot; after rotating
`DUCKDB_AUTH_TOKEN` in `.env`, recreate the service (data is kept):

```sh
podman compose -f templates/duckdb/compose.yml --env-file templates/duckdb/.env up -d --force-recreate
```

For stricter setups, Quack lets you replace the authentication and
authorization hooks with SQL macros (per-user tokens, read-only mode) — see
the [Quack security docs](https://duckdb.org/docs/current/quack/security).

# Reverse proxy

Quack speaks plain HTTP. nginx and Caddy recipes (TLS termination, larger
`client_max_body_size` for big INSERTs, streaming-aware `proxy_buffering off`)
are in the [Quack reverse-proxy guide](https://duckdb.org/docs/current/quack/setup/reverse_proxy).

# Data and backups

The volume holds the database file (`main.duckdb` and its WAL) plus
`~/.duckdb/extensions`. Back up by snapshotting the volume, or export SQL:

```sh
podman exec duckdb-duckdb-1 /duckdb /data/main.duckdb -c "EXPORT DATABASE '/data/backup'"
```