## Which version

This template pins the `2` tag, which follows the latest 2.x release. Upstream keeps
`latest` on the **1.x** branch, so don't switch to it: 1.x cannot read an `/app/data`
written by 2.x and the container will fail to start.

## First boot

```sh
podman compose -f templates/uptime-kuma/compose.yml \
  --env-file templates/uptime-kuma/.env up -d
```

Open <http://localhost:3001> (or whatever `UPTIME_KUMA_PORT` is set to) and
create the admin account on the setup screen. There are no default credentials.

## Reset

All state lives in the `uptime_kuma_data` named volume:

```sh
podman compose -f templates/uptime-kuma/compose.yml down -v
```
