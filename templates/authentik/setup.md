# After deploying

Open `http://<host>:9000` and log in as `akadmin` with `AUTHENTIK_BOOTSTRAP_PASSWORD`. First boot runs migrations and takes 1–2 minutes.

The bootstrap credentials apply on first boot only. Change the password later in the admin interface, not in `.env`.

Behind a reverse proxy, forward your domain (e.g. `https://auth.example.com`) to port `9000`. authentik reads `X-Forwarded-*` headers, so no hostname variable is needed.

`AUTHENTIK_SECRET_KEY` signs sessions and cookies. Never change it after first boot.

Managed outposts via the Docker socket aren't enabled. Deploy outposts manually if you need proxy or LDAP providers.
