# Before deploying

Replace `RUSTRAK_SESSION_SECRET_KEY` with a securely generated 64-character hexadecimal value, and replace the password in `RUSTRAK_CREATE_SUPERUSER`. The repository's `.env` contains only safe placeholders.

Generate the session secret with `openssl` (32 random bytes → 64 hex chars):

```sh
openssl rand -hex 32
```

Paste the output into `RUSTRAK_SESSION_SECRET_KEY` in `.env`. Pick a strong password for `RUSTRAK_CREATE_SUPERUSER` and store it in a password manager — do not reuse the session secret.

Open the dashboard at port `${RUSTRAK_UI_PORT}` and sign in with the initial superuser credentials. Create a project, copy its DSN, and use that DSN with any Sentry-compatible SDK. The API on `${RUSTRAK_SERVER_PORT}` must be reachable by applications that submit events.

This template uses Rustrak's default SQLite storage for a small, self-contained deployment. The named `rustrak_data` volume preserves events and configuration.
