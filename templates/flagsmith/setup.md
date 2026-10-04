# First run

Open `http://localhost:8000` and create an account on the sign-up screen. No user is
pre-seeded; the first account becomes the organization admin.

# Stop open sign-ups

When the instance is not meant for further self-registration, set
`FLAGSMITH_PREVENT_SIGNUP=true` in `.env` and restart. New account creation is closed
after that; teammates join by invitation from the admin UI.

# Django admin

The `/admin/` console needs a superuser. Follow the official Docker guide — it shows the
one-liner to create one inside the running container
(`docs.flagsmith.com/deployment-self-hosting/hosting-guides/docker`).

# SDKs

Point client SDKs at `http://localhost:8000/api/v1/` and use a project environment's
server-side key from the UI.