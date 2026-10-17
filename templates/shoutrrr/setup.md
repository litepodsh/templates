# Before deploying

## First account

Open the app and register — the first account is yours. Migrations run
automatically on start; data lives in SQLite on the `shoutrrr_sqlite` volume
and uploads/keys on `shoutrrr_storage`.

## HTTPS

`SHOUTRRR_APP_URL` is `{{url}}`: LitePod fills it with the app's domain on every
deploy. Passkeys, secure cookies and the OAuth callbacks of X, LinkedIn and Meta
need HTTPS, so add your own domain with a certificate, then set
`SHOUTRRR_OCTANE_HTTPS=true` and `SHOUTRRR_SESSION_SECURE_COOKIE=true` and
redeploy.

## `APP_KEY`

`SHOUTRRR_APP_KEY` is generated once at creation. Don't change it afterwards —
connected account tokens are encrypted with it.

## Connecting social accounts

Bluesky (app password) and Discord (webhook URL) work without extra setup. For
the others, create an OAuth app with the provider, fill its `*_CLIENT_ID` /
`*_CLIENT_SECRET` pair and register this callback URL:

| Provider             | Callback                              |
| -------------------- | ------------------------------------- |
| X                    | `<APP_URL>/accounts/callback/x`        |
| LinkedIn             | `<APP_URL>/accounts/callback/linkedin` |
| Facebook + Instagram | `<APP_URL>/accounts/callback/meta`     |
| Threads              | `<APP_URL>/accounts/callback/threads`  |

Required scopes are listed in upstream's
[`.env.example.prod`](https://github.com/coollabsio/shoutrrr/blob/main/.env.example.prod).

## Large uploads

Videos up to 1 GiB are accepted. For big media libraries set
`SHOUTRRR_FILESYSTEM_DISK=s3` and fill the `SHOUTRRR_AWS_*` values (S3, R2,
MinIO, Garage, …).
