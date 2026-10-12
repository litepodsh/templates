## First boot

```sh
podman compose -f templates/termix/compose.yml \
  --env-file templates/termix/.env up -d
```

Open <http://localhost:8080> (or whatever `TERMIX_PORT` is set to) and create the
admin account on the setup screen. There are no default credentials.

## Secrets come from the environment

`JWT_SECRET`, `DATABASE_KEY`, `ENCRYPTION_KEY` and `INTERNAL_AUTH_TOKEN` are set
by LitePod and kept stable across redeploys. Don't change them on a running
install: `JWT_SECRET` signs sessions, and `DATABASE_KEY` / `ENCRYPTION_KEY` open
the encrypted database and the host credentials stored in it. Losing them makes
that data unreadable.

## HTTPS

Termix works over plain http, but put it behind a reverse proxy or turn on
HTTPS (see the [Termix HTTPS docs](https://docs.termix.site/configure/https))
before exposing it to the internet. Plugins that use a browser secure context,
such as Passkeys, need HTTPS to work.

## Remote desktop (guacd)

The bundled `guacd` service backs the Remote Desktop plugin (RDP/VNC/Telnet). It
stays on the Compose network and Termix reaches it by service name. Session
recordings and the RDP drive live on the shared `termix_data` volume, so they
survive restarts. If you don't use the Remote Desktop plugin you can drop the
`guacd` service and the `GUACD_*` variables.

## Reset

All state lives in the `termix_data` named volume:

```sh
podman compose -f templates/termix/compose.yml down -v
```
