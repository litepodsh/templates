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

Configure the `GHOST_MAIL_*` SMTP values. `GHOST_URL` is `{{url}}`: LitePod
fills it with the app's domain on every deploy, so adding your own domain (for
example `https://blog.example.com`) and redeploying is enough. Do that before
sharing links or sending newsletters — copies already sent out keep the old
address.

Outside LitePod, set it by hand:

```dotenv
GHOST_URL=https://blog.example.com
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
