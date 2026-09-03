# Ente + MinIO (self-hosted)

The heaviest template in the catalog — five containers:

| Service | Role |
| ------- | ---- |
| `ente-museum` | the Ente API server, port 8080 |
| `ente-web` | Photos web app (`:3000`) and public Albums app (`:3002`) |
| `ente-db` | PostgreSQL 15 — account and file metadata |
| `ente-minio` | S3-compatible object storage for the encrypted blobs; web console on `:3201` |
| `ente-minio-provision` | one-shot; creates the `b2-eu-cen` bucket, then exits |

Ente self-hosting only supports S3-style object storage — there is no local-disk
mode — so MinIO is part of the stack. Its console (`:3201`, log in with
`ENTE_S3_ACCESS_KEY` / `ENTE_S3_SECRET_KEY`) is exposed for browsing the stored
objects.

MinIO is **pinned to `RELEASE.2025-04-22T22-12-26Z`** — the last Community
Edition build with a full management console. Later releases strip the console
down to a bare object browser. The pin means no security updates past that date;
bump the `ente-minio` / `ente-minio-provision` image tags if you don't need the admin UI.

## 1. Crypto secrets

Litepod replaces the `{{base64_32}}`, `{{base64_64}}` and
`{{base64url_32}}` markers in `.env` with cryptographically random values when
the template is deployed. Back up the resulting values and do not regenerate
them during a redeploy. Losing them makes every existing account permanently
unrecoverable.

## 2. Domains and public origins

Create these domain routes in Litepod:

| Purpose | Route target | Example |
| ------- | ------------ | ------- |
| Photos user interface | `ente-web:3000` | `https://photos.example.com` |
| Ente API | `ente-museum:8080` | `https://api.photos.example.com` |
| Public albums | `ente-web:3002` | `https://albums.photos.example.com` |

The Photos user interface has no separate origin variable; its domain is the
route that targets `ente-web:3000`. Set `ENTE_API_ORIGIN` to the complete public
HTTPS URL routed to `ente-museum:8080`, and set `ENTE_ALBUMS_ORIGIN` to the
complete public HTTPS URL routed to `ente-web:3002`. Do not add a trailing
slash.

For example:

```dotenv
ENTE_API_ORIGIN=https://api.photos.example.com
ENTE_ALBUMS_ORIGIN=https://albums.photos.example.com
```

The mobile and desktop apps also need the API endpoint: in the app, tap the
onboarding screen title 7 times and enter `ENTE_API_ORIGIN`.

## 3. Create the first account

Without SMTP configured, the sign-up **verification code is written to the
museum log**:

```sh
podman compose logs ente-museum 2>&1 | grep -i 'verification code'
```

Set the `ENTE_SMTP_*` values in `.env` to have codes emailed instead.

## 4. Ente → MinIO connection

Museum is configured through `ENTE_*` environment overrides rather than a
mounted `museum.yaml`. These `.env` variables define its connection to the
included MinIO service:

| Variable | Purpose | Bundled MinIO value |
| -------- | ------- | ------------------- |
| `ENTE_S3_ACCESS_KEY` | Access key shared by museum and MinIO's root user | `ente` |
| `ENTE_S3_SECRET_KEY` | Secret shared by museum and MinIO's root user | Generated password placeholder |
| `ENTE_S3_ENDPOINT` | S3 endpoint reachable from the museum container | `ente-minio:3200` |
| `ENTE_S3_REGION` | Region passed to the S3 client | `eu-central-2` |
| `ENTE_S3_BUCKET` | Physical bucket used for encrypted objects | `b2-eu-cen` |
| `ENTE_S3_ARE_LOCAL_BUCKETS` | Enables Ente's local-storage compatibility behavior, including HTTP | `true` |
| `ENTE_S3_USE_PATH_STYLE_URLS` | Generates URLs such as `/bucket/object`, required by this MinIO setup | `true` |

Compose passes the same access key and secret to museum, MinIO and the
provisioning job, so their credentials cannot drift apart. The
`ente-minio-provision` service uses `ENTE_S3_BUCKET` to create the bucket
automatically and make it private.

Ente's internal storage slot is still named `b2-eu-cen` for historical
compatibility; `ENTE_S3_BUCKET` controls the real bucket name. If uploads fail
with storage errors, verify `ENTE_S3_B2_EU_CEN_*` reached the container
(`podman compose exec ente-museum env | grep ENTE_S3`) and that the `ente-minio-provision`
job completed.
