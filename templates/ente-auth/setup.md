# Ente Auth (self-hosted)

Three containers:

| Service | Role |
| ------- | ---- |
| `ente-museum` | Ente API server, port 8080 |
| `ente-web` | Auth web app, port 3003 |
| `ente-db` | PostgreSQL 15 — accounts and the encrypted 2FA vault |

Auth syncs an end-to-end encrypted copy of your 2FA codes; the server stores
only ciphertext, in Postgres. **No object storage is needed**, which is why this
stack has no MinIO/S3 service — museum's storage slots stay unset.

## 1. Crypto secrets

Litepod replaces `{{base64_32}}`, `{{base64_64}}` and `{{base64url_32}}` in
`.env` with random values on deploy. Back them up: losing them makes every
existing account unrecoverable.

## 2. Domains

| Purpose | Route target | Example |
| ------- | ------------ | ------- |
| Auth web app | `ente-web:3003` | `https://auth.example.com` |
| Ente API | `ente-museum:8080` | `https://api.auth.example.com` |

`ENTE_API_ORIGIN` is `{{url:8080}}`; LitePod creates that route on first deploy
and rebinds the variable if you attach a custom domain later. Outside LitePod,
set it to the full API URL without a trailing slash:

```dotenv
ENTE_API_ORIGIN=https://api.auth.example.com
```

The web app needs a **secure context** (HTTPS or localhost) for browser-side
crypto, hence `requires_https`.

## 3. Create the first account

Open the Auth web app, choose **Don't have an account?** and sign up. Without
SMTP the verification code is written to the museum log:

```sh
podman compose logs ente-museum 2>&1 | grep -i 'verification code'
```

Set `ENTE_SMTP_*` in `.env` to email codes instead. Save the recovery key shown
after signup — it is the only way back in if the password is lost.

## 4. Point clients at this server

In the mobile, desktop or browser extension, tap the onboarding/login title
**7 times** to open developer settings and enter `ENTE_API_ORIGIN`
(for example `https://api.auth.example.com`). Codes then sync through your
instance instead of Ente's.

Signing up with the same email as your hosted Ente Auth account creates a
**separate** account here with its own password and recovery key; nothing is
migrated.

## 5. Notes

- Passkeys are optional and stay disabled unless museum's `webauthn` config is
  set. Password + recovery key works out of the box.
- Ente Auth does not require the Photos server; this stack can run on its own.
