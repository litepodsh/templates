# Invoice Ninja

Four services: `app` (PHP-FPM), `nginx` (web front-end), `db` (MySQL), and a
one-shot `nginx-config` that seeds the vhost into the `invoiceninja_nginx`
volume. Cache, sessions and the job queue use the filesystem / database — no
Redis.

## 1. Generate `APP_KEY` before the first start

Invoice Ninja will not boot without it, and changing it later makes all
encrypted fields unreadable.

```sh
podman run --rm docker.io/invoiceninja/invoiceninja-debian:latest \
  php artisan key:generate --show
```

Copy the whole output (`base64:....`) into `INVOICENINJA_APP_KEY` in `.env`.

## 2. First start

The `app` container runs migrations and creates the admin account from
`INVOICENINJA_ADMIN_EMAIL` / `INVOICENINJA_ADMIN_PASSWORD` on the first boot with
an empty database. This can take a minute; watch `podman logs -f invoiceninja_app_1`.

## 3. Log in

Open the site and sign in with the admin credentials. Set a real `MAIL_MAILER`
(SMTP) in `.env` to send invoices — with `log` they are only written to the
container log.

## Notes

- `INVOICENINJA_APP_URL` must match the external origin exactly, or the client
  portal and PDF links break.
- Behind a TLS-terminating proxy, set `INVOICENINJA_REQUIRE_HTTPS=true`;
  `TRUSTED_PROXIES` is already `*`.
- Uploaded logos and generated PDFs live in `invoiceninja_storage`; the public
  asset symlink tree in `invoiceninja_public`.
