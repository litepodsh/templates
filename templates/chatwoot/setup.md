# After deploying

The first boot creates the database and runs migrations. This takes 1–3 minutes. The worker starts only after the web app is healthy.

## 1. Create the super admin

1. Open the app domain. LitePod gives you an `sslip.io` domain by default.
2. You land on `/installation/onboarding`. Fill in your name, company, email and password.
3. This first user is the **super admin**. Sign-up is off (`CHATWOOT_ENABLE_ACCOUNT_SIGNUP=false`), so no one else can register.

## 2. Use your own domain (recommended)

1. In LitePod, open the app and go to **Domains**.
2. Add your domain (for example `support.example.com`) on service `chatwoot`, port `3000`, and enable HTTPS.
3. Mark it as primary and redeploy.

`CHATWOOT_FRONTEND_URL` is `{{url}}`. LitePod rewrites it to the primary domain on every deploy. Do not hard-code it. Chatwoot uses this URL in emails, widget scripts and webhooks.

Set the domain **before** you install the website widget. The widget snippet embeds this URL.

## 3. Configure email (SMTP)

Without SMTP, Chatwoot cannot send invitations, password resets or email notifications.

In LitePod, open the app's **Environment** and set:

| Variable | Example |
| --- | --- |
| `CHATWOOT_MAILER_SENDER_EMAIL` | `Support <support@example.com>` |
| `CHATWOOT_SMTP_ADDRESS` | `smtp.resend.com` |
| `CHATWOOT_SMTP_PORT` | `587` |
| `CHATWOOT_SMTP_DOMAIN` | `example.com` |
| `CHATWOOT_SMTP_USERNAME` | your SMTP user |
| `CHATWOOT_SMTP_PASSWORD` | your SMTP password |
| `CHATWOOT_SMTP_AUTHENTICATION` | `login` or `plain` |

Redeploy after saving. The sender address must belong to a domain your SMTP provider has verified.

## 4. Add an inbox

1. Log in. Go to **Settings → Inboxes → Add Inbox**.
2. Choose a channel:
   - **Website**: copy the generated `<script>` and paste it before `</body>` on your site.
   - **Email**: forward a support address to the inbox, or connect it via IMAP/SMTP.
   - **WhatsApp, Instagram, Facebook, Telegram, SMS, API**: follow the on-screen steps. Meta channels need a public HTTPS domain.
3. Add agents to the inbox.

## 5. Invite your team

Go to **Settings → Agents → Add Agent**. Invitations go out by email, so configure SMTP first.

## 6. Super admin console

Open `/super_admin` and log in with the super admin account. Here you manage accounts, users and **Installation Config**. Many integrations (Facebook, Slack, Google, OpenAI) can be set here instead of in env vars.

## Notes

- `CHATWOOT_SECRET_KEY_BASE` signs sessions and encrypted data. Never change it after first boot.
- Uploads are stored in the `chatwoot_storage` volume. Back it up with `chatwoot_postgres_data`.
- Keep `CHATWOOT_FORCE_SSL=false`. LitePod's proxy terminates TLS.
- Postgres uses `pgvector` on PG 16, as Chatwoot recommends. Do not change the major version on an existing install without a dump and restore.
- To upgrade, change `CHATWOOT_VERSION` and redeploy. Migrations run automatically on boot. Read the [release notes](https://github.com/chatwoot/chatwoot/releases) first.
