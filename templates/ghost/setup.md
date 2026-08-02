## MySQL 8.4

The `db` service is pinned to MySQL 8.4 LTS. If you ran an earlier revision of
this template (which used the floating `mysql:8.0` tag), the existing
`mysql_data` volume was initialised by 8.0 and 8.4 will refuse to start on it.
Drop the volume before bringing the stack up:

```sh
podman compose -f templates/ghost/compose.yml down -v
```

That also wipes `ghost_content` (themes, images, settings). Export your content
from Ghost Admin first if you need it.

## Before first boot

Replace `MYSQL_ROOT_PASSWORD` in `.env`, set `GHOST_URL` to the address
readers will actually use, and configure the `GHOST_MAIL_*` SMTP values. Ghost
bakes its URL into every generated link, so changing it later means rewriting
URLs in the database:

```toml
GHOST_URL = "https://blog.example.com"
```

The shipped SMTP placeholders show Mailgun's standard relay settings. Replace
them with the credentials and sender address from your own SMTP provider.

## First boot

```sh
podman compose -f templates/ghost/compose.yml \
  --env-file templates/ghost/.env up -d
podman compose -f templates/ghost/compose.yml logs -f db
```

MySQL runs a one-time init the first time it writes to `mysql_data`. Ghost
restarts until the database accepts connections, which is expected. Then:

- **Site**: <http://localhost:2368>
- **Admin**: <http://localhost:2368/ghost> — create the owner account here

## Reset

```sh
podman compose -f templates/ghost/compose.yml down -v
```
