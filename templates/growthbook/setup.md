# First run

Open `http://localhost:3000` and create the admin account / organization on the sign-up
screen. No user is pre-seeded.

# Two ports

| Port | URL                        | What it is                          |
| ---- | -------------------------- | ----------------------------------- |
| 3000 | `http://localhost:3000`    | Web UI                              |
| 3100 | `http://localhost:3100`    | REST API — point the SDKs here      |

# Secrets

`GROWTHBOOK_JWT_SECRET` signs auth tokens and `GROWTHBOOK_ENCRYPTION_KEY` protects stored
data-source credentials. Both are random placeholders in the tracked `.env` — replace them
before running anything past a test instance. `NODE_ENV=production` is already set and
refuses the default JWT secret.

Changing `ENCRYPTION_KEY` later requires migrating existing data sources: GrowthBook ships
`migrate-encryption-key.js` for that, so settle the key before storing credentials.

# Different host or port

If the UI is not reachable at `localhost:3000`, update `GROWTHBOOK_APP_ORIGIN` and
`GROWTHBOOK_API_HOST` to the public URLs. GrowthBook uses them to generate links and the
API's CORS rules.