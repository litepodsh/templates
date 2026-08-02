## Which version `latest` gives you

Upstream publishes the 2.x line under the `2` / `2.x.y` tags and keeps `latest`
pointing at the **1.x** branch. This template pins `latest`, so a fresh deploy
gets Uptime Kuma 1.x.

If you previously ran this template on a 2.x tag, **do not** pull over it: 1.x
cannot read an `/app/data` written by 2.x and the container will fail to start.
Either wipe the volume and start over:

```sh
podman compose -f templates/uptime-kuma/compose.yml down -v
```

or stay on 2.x by changing the image to `docker.io/louislam/uptime-kuma:2`.

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
