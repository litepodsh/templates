# Ente Locker + MinIO (self-hosted)

Five containers:

| Service | Role |
| ------- | ---- |
| `ente-museum` | Ente API server, port 8080 |
| `ente-web` | Locker app (`:3009`) and public share app (`:3005`) |
| `ente-db` | PostgreSQL 15 — accounts and item metadata |
| `ente-minio` | S3-compatible object storage for encrypted documents; console on `:3201` |
| `ente-minio-provision` | one-shot; creates the `b2-eu-cen` bucket, then exits |

Locker stores document metadata (encrypted) through museum and the file blobs in
S3-compatible storage. Ente has no local-disk mode, so MinIO is part of the
stack.

MinIO runs `pgsty/minio`, a maintained community build of upstream MinIO that
keeps the full admin console (upstream stopped publishing public images in
2025). The `ente-minio-provision` job creates the private bucket and exits.

## 1. Crypto secrets

Litepod replaces `{{base64_32}}`, `{{base64_64}}` and `{{base64url_32}}` in
`.env` with random values on deploy. Back them up and never regenerate them on
redeploy: losing them makes every existing account and every stored document
unrecoverable.

## 2. Domains

| Purpose | Route target | Example |
| ------- | ------------ | ------- |
| Locker app | `ente-web:3009` | `https://locker.example.com` |
| Public share links | `ente-web:3005` | `https://share.locker.example.com` |
| Ente API | `ente-museum:8080` | `https://api.locker.example.com` |

`ENTE_API_ORIGIN` is `{{url:8080}}` and `ENTE_PUBLIC_LOCKER_ORIGIN` is
`{{url:3005}}`; museum receives the latter as `ENTE_APPS_PUBLIC_LOCKER`, so
generated share links point at your instance instead of `share.ente.com`.
LitePod creates both routes on first deploy. Outside LitePod, set them to full
URLs without trailing slashes.

The Locker app needs a **secure context** (HTTPS or localhost) for browser-side
crypto, hence `requires_https`.

## 3. Create the first account

Open the Locker web app and sign up. Without SMTP the verification code goes to
the museum log:

```sh
podman compose logs ente-museum 2>&1 | grep -i 'verification code'
```

Set `ENTE_SMTP_*` in `.env` to email codes instead. Save the recovery key shown
after signup.

## 4. Object storage

| Variable | Purpose | Bundled value |
| -------- | ------- | ------------- |
| `ENTE_S3_ACCESS_KEY` | Access key shared by museum and MinIO's root user | `ente` |
| `ENTE_S3_SECRET_KEY` | Secret shared by museum and MinIO | Generated password |
| `ENTE_S3_ENDPOINT` | Endpoint museum uses | `ente-minio:3200` |
| `ENTE_S3_REGION` | Region for the S3 client | `eu-central-2` |
| `ENTE_S3_BUCKET` | Physical bucket name | `b2-eu-cen` |
| `ENTE_S3_ARE_LOCAL_BUCKETS` | Local-store compatibility (HTTP, path URLs, no storage classes) | `true` |
| `ENTE_S3_USE_PATH_STYLE_URLS` | Use `/bucket/object` URLs | `true` |

Uploads use presigned URLs, and museum embeds `ENTE_S3_ENDPOINT` in them — that
host must also resolve **from the browser**. The compose value
`ente-minio:3200` only resolves inside the Compose network, so document uploads
from a browser or phone need an extra step: expose MinIO on a public route
(uncomment the `ENTE_MINIO_CONSOLE_PORT`/MinIO `ports` mapping plus a
`3200` route) and set `ENTE_S3_ENDPOINT` to that public `host:port`. Web uploads
on the same machine can also work by mapping `127.0.0.1:3200`.

If uploads fail, check the bucket was created (`ente-minio-provision` completed)
and that `podman compose exec ente-museum env | grep ENTE_S3` shows the values.

## 5. Plan limits

Museum always enforces Locker's **free tier** on a self-hosted instance: 100
items and 1 GiB, because there is no paid subscription to unlock 1000 items /
10 GiB. Share links and end-to-end encryption work normally; the limit is the
only functional restriction.

## 6. Point clients at this server

In the mobile or desktop Locker app, tap the onboarding title **7 times** and
enter `ENTE_API_ORIGIN`. Ente Paste integration is not part of this stack and
falls back to `paste.ente.com`; ignore it unless you deploy the Paste app too.
