# Configure Gitea Mirror

Before deployment, replace `GITEA_MIRROR_AUTH_SECRET` in `.env` with a unique secret of at least 32 characters. If you deploy behind a reverse proxy or on a domain, set `GITEA_MIRROR_AUTH_URL`, `GITEA_MIRROR_PUBLIC_AUTH_URL`, and `GITEA_MIRROR_AUTH_TRUSTED_ORIGINS` to its public origin.

Open the web UI and create the first account, which becomes the administrator. Then configure your GitHub and Gitea or Forgejo credentials, mirror destinations, and synchronization schedule in the UI.
