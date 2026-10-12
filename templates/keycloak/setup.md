# After deploying

Open `http://<host>:8080/admin` and log in with `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`. Startup takes ~30–60 s on first boot.

`KEYCLOAK_HOSTNAME` is `{{url}}`: litepod fills it with the app's domain on every deploy. Add your HTTPS domain (e.g. `https://auth.example.com`) and redeploy, or redirects and tokens point at the generated address. Outside litepod, set it to the exact public URL.

The bootstrap admin is temporary and created on first boot only. Create a permanent admin user in the `master` realm, then delete the bootstrap one.

This template runs `start-dev`: HTTP only, caching and themes in dev mode. Don't use it for production.
