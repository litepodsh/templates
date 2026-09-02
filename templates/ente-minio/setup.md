# Ente + MinIO (self-hosted)

The heaviest template in the catalog — five containers:

| Service | Role |
| ------- | ---- |
| `museum` | the Ente API server, port 8080 |
| `web` | Photos web app (`:3000`) and public Albums app (`:3002`) |
| `db` | PostgreSQL 15 — account and file metadata |
| `minio` | S3-compatible object storage for the encrypted blobs; web console on `:3201` |
| `minio-provision` | one-shot; creates the `b2-eu-cen` bucket, then exits |

Ente self-hosting only supports S3-style object storage — there is no local-disk
mode — so MinIO is part of the stack. Its console (`:3201`, log in with
`ENTE_S3_ACCESS_KEY` / `ENTE_S3_SECRET_KEY`) is exposed for browsing the stored
objects.

MinIO is **pinned to `RELEASE.2025-04-22T22-12-26Z`** — the last Community
Edition build with a full management console. Later releases strip the console
down to a bare object browser. The pin means no security updates past that date;
bump the `minio` / `minio-provision` image tags if you don't need the admin UI.

## 1. Generate the crypto secrets

`.env` ships these **empty** — museum will not start until they are set:

```sh
echo "ENTE_KEY_ENCRYPTION=$(openssl rand -base64 32)"
echo "ENTE_KEY_HASH=$(openssl rand -base64 64)"
echo "ENTE_JWT_SECRET=$(openssl rand -base64 32)"
```

Paste the values into `.env`. Back them up — losing them makes every existing
account permanently unrecoverable.

## 2. Origins

- `ENTE_API_ORIGIN` — the museum URL as the **browser** will reach it. Publish
  port 8080 (uncomment in `compose.yml`) or route a hostname to `museum:8080`.
- `ENTE_ALBUMS_ORIGIN` — public shared-album URL; must match how the albums app
  (`:3002`) is served.

The mobile and desktop apps also need the API endpoint: in the app, tap the
onboarding screen title 7 times and enter `ENTE_API_ORIGIN`.

## 3. Create the first account

Without SMTP configured, the sign-up **verification code is written to the
museum log**:

```sh
podman logs ente_museum_1 2>&1 | grep -i 'verification code'
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
| `ENTE_S3_ENDPOINT` | S3 endpoint reachable from the museum container | `minio:3200` |
| `ENTE_S3_REGION` | Region passed to the S3 client | `eu-central-2` |
| `ENTE_S3_BUCKET` | Physical bucket used for encrypted objects | `b2-eu-cen` |
| `ENTE_S3_ARE_LOCAL_BUCKETS` | Enables Ente's local-storage compatibility behavior, including HTTP | `true` |
| `ENTE_S3_USE_PATH_STYLE_URLS` | Generates URLs such as `/bucket/object`, required by this MinIO setup | `true` |

Compose passes the same access key and secret to museum, MinIO and the
provisioning job, so their credentials cannot drift apart. The
`minio-provision` service uses `ENTE_S3_BUCKET` to create the bucket
automatically and make it private.

Ente's internal storage slot is still named `b2-eu-cen` for historical
compatibility; `ENTE_S3_BUCKET` controls the real bucket name. If uploads fail
with storage errors, verify `ENTE_S3_B2_EU_CEN_*` reached the container
(`podman exec ente_museum_1 env | grep ENTE_S3`) and that the `minio-provision`
job completed.
