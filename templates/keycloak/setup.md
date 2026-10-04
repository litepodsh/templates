# After deploying

Open `http://<host>:8080/admin` and log in with `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`. Startup takes ~30–60 s on first boot.

Set `KEYCLOAK_HOSTNAME` to the exact public URL (e.g. `https://auth.example.com`) before deploying behind a reverse proxy, or redirects and tokens will point at the wrong host.

The bootstrap admin is temporary and created on first boot only. Create a permanent admin user in the `master` realm, then delete the bootstrap one.

This template runs `start-dev`: HTTP only, caching and themes in dev mode. Don't use it for production.
