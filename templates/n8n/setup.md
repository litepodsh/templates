# n8n

Single container, SQLite in the `n8n_data` volume — no external database. Fine
for personal and small-team use; switch to the Postgres-backed setup from the
[n8n docs](https://docs.n8n.io/hosting/) if you need concurrent executions at
scale.

- **`N8N_ENCRYPTION_KEY`** encrypts every stored credential. Back it up. If it is
  lost or changed, all saved credentials become unreadable and must be
  re-entered. The tracked `.env` ships a placeholder — set a real value before
  first start.
- **`N8N_WEBHOOK_URL`** must be the real external origin (including the trailing
  slash). Webhook trigger nodes and OAuth2 callback URLs are derived from it, so
  behind a reverse proxy set it to `https://your-domain/`.
- Editor access is protected by HTTP basic auth (`N8N_BASIC_AUTH_USER` /
  `N8N_BASIC_AUTH_PASSWORD`). Replace the password placeholder.
