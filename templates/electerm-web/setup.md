## First boot

```sh
podman compose -f templates/electerm-web/compose.yml \
  --env-file templates/electerm-web/.env up -d
```

Open <http://localhost:8082> (or whatever `ELECTERM_PORT` is set to) and sign in
with `ELECTERM_USER` / `ELECTERM_PASSWORD`.

## Sign-in is on by default

Upstream ships with no authentication, which means anyone who can reach the UI
gets a shell on every host you connect to. This template turns it on:

- `ELECTERM_ENABLE_AUTH=1` requires `ELECTERM_USER` / `ELECTERM_PASSWORD` to sign in.
- `ELECTERM_SERVER_SECRET` signs the login session; changing it logs everyone out.
- `ELECTERM_DISABLE_LOCAL_TERMINAL=1` removes the shell **inside the container**
  itself. Connecting out to your own hosts still works.

Only set `ELECTERM_ENABLE_AUTH=0` when something in front already authenticates
the request (an SSO proxy, a private network), and don't put it on the open
internet without HTTPS.

## HTTPS

Credentials, SSH keys and terminal traffic cross the wire, so put it behind a
reverse proxy or a TLS certificate before exposing it. See the
[electerm-web nginx examples](https://github.com/electerm/electerm-web/tree/main/examples).

## Data

Hosts, keys and settings live in the `electerm_data` named volume
(`/home/electerm/data` inside the container). Since electerm-web v3 the data is
SQLite; if you are moving from an older NeDB install, see the
[v2 to v3 migration notes](https://github.com/electerm/electerm-web#migration-from-v2-to-v3).

## Reset

```sh
podman compose -f templates/electerm-web/compose.yml down -v
```
