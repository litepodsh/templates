# Sure

Sure has no default account.

1. Open the app's domain and click **Create account**.
2. The first user owns the family and gets admin rights.
3. Set `SURE_ONBOARDING_STATE` to `closed` or `invite_only` and redeploy, so
   strangers can't sign up. You can also change it later in
   **Settings → Self-Hosting**.

The first boot runs database migrations and takes a minute or two.

## Optional features

- **Email**: fill in `SURE_SMTP_*` and `SURE_EMAIL_SENDER` for password resets
  and invites.
- **AI chat and rules**: set `SURE_OPENAI_ACCESS_TOKEN`. Point
  `SURE_OPENAI_URI_BASE` at any OpenAI-compatible server to use a local model,
  and set `SURE_OPENAI_MODEL` to match.
- **Market data and bank sync** are configured in **Settings → Self-Hosting**.

Over https, set `SURE_RAILS_ASSUME_SSL=true` so cookies are marked secure.
