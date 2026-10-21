## HTTPS is required

The session cookie is marked `Secure`, so over plain `http://` sign-in succeeds but no
session is kept. Put a domain with a certificate on **both** routes before signing in:

- Web app (port 3001), for example `plan.example.com`
- API (port 3000), for example `api.plan.example.com`

The two must share a registrable domain. The session cookie goes on the parent domain of
the web app (`.example.com` here); set `ITSAPLAN_COOKIE_DOMAIN` when that guess is wrong,
for example when the web app is on the apex domain.

Redeploy after changing a domain: the web app and api read their URLs at startup.

## First account

The first account you register becomes the instance admin (god mode). Mail transport,
the Telegram bot token and upload limits are configured there, not in `.env`.

## Upgrades

Update the image tags in `compose.yml` and redeploy. The `migrate` service dumps the database to the
`itsaplan_db_backups` volume before applying a release's migrations.
