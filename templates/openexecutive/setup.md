Open Executive is a single-tenant AI executive team. After deploying you onboard your company in the web UI and the agents work from that profile.

## Before the first start

1. **Model key.** Set `ANTHROPIC_API_KEY`, or set `OPENROUTER_ENABLED=true` with `OPENROUTER_API_KEY`. Without one the API refuses to start and the UI shows errors.
2. **Executive mailbox.** Set `EXEC_EMAIL_ADDRESS` to the address the Executive acts as (its Google or Microsoft 365 account). The API won't start without it, and the default `exec@example.com` is only a placeholder.
3. **Sign-in.** There is no local login on a server. Set `ALLOWED_EMAILS` and either a Google OAuth client (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`) or an OIDC provider (`AUTH_OIDC_*`). Register `https://<your domain>/api/auth/callback/google` (or `/oidc`) as the redirect URI. Only the emails listed can sign in.

`AUTH_SECRET` and `BACKEND_SHARED_SECRET` are generated for you.

## First boot

The API builds its vector index on a cold start and can take a few minutes before it answers. The web UI may show errors until then. Give the API at least 2 GB of memory.

Open the web UI and run the onboarding wizard. On a fresh volume, "no company profile" before onboarding is expected.

## Notes

- **Single API instance.** Never scale `openexecutive-api` above one replica: its scheduler would fire every scheduled action twice.
- **Integrations** (Slack, Discord, email, Google Workspace, Microsoft 365, MCP tools) are optional and off by default. They are configured from the app or with extra variables from the [`.env.example`](https://github.com/ForeactLabs/OpenExecutive/blob/main/.env.example); add them under `environment:` of `openexecutive-api`.
- **Signed callers** (`CALLER_ASSERTION_*`) are recommended: generate the key pair with the repo's `scripts/make-caller-keys.py` and set both halves.
- All state lives in the `openexecutive_data` volume: vector index, SQLite memory database, company profile and uploaded documents.
