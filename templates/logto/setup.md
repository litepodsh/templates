# After deploying

Open the admin console at `http://<host>:3002` and create the first admin account. The first user to register becomes the admin, so do it right away.

Logto needs two public URLs: `LOGTO_ENDPOINT` (apps and users, port `3001`) and `LOGTO_ADMIN_ENDPOINT` (admin console, port `3002`). They are `{{url}}` and `{{url:3002}}`: litepod creates a domain for each port and keeps both variables pointing at them; put your `https://` hostnames on those routes and redeploy. Outside litepod, set both to the exact public URLs.

The database is seeded on first boot. Upgrades run migrations with `npm run cli db alteration deploy <version>` inside the container; check the Logto release notes first.
