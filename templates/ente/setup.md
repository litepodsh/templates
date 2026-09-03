# Ente with external S3 storage

This template runs Ente's API, web apps and PostgreSQL. It does not include an
object-storage service: create a private bucket in your S3-compatible provider
before deploying Ente.

## 1. Configure S3

Set these values in `.env`:

| Variable | What to enter |
| -------- | ------------- |
| `ENTE_S3_ACCESS_KEY` | Access-key ID with read, write and delete access to the bucket |
| `ENTE_S3_SECRET_KEY` | Secret corresponding to the access key |
| `ENTE_S3_ENDPOINT` | Provider endpoint reachable by museum, without the bucket name, for example `s3.us-east-1.amazonaws.com` |
| `ENTE_S3_REGION` | Provider region; use `auto` for Cloudflare R2 |
| `ENTE_S3_BUCKET` | Name of the existing private bucket |
| `ENTE_S3_ARE_LOCAL_BUCKETS` | Keep `false` for external storage; `true` enables local-store workarounds and disables SSL |
| `ENTE_S3_USE_PATH_STYLE_URLS` | Usually `false`; set `true` when the provider requires `endpoint/bucket/object` URLs |

Museum receives these as `ENTE_S3_B2_EU_CEN_*`. The `B2_EU_CEN` part is Ente's
fixed historical name for its primary storage slot; it does **not** restrict
you to Backblaze or to a European region. The actual provider, region and bucket
come from the `.env` values above.

Uploads use presigned URLs, so the endpoint must also be reachable from user
browsers. Configure the bucket's CORS policy to allow requests from your Ente
web origin. Do not enable bucket versioning or object lock for Ente file
storage. If the provider uses subdomain-style URLs, leave path style disabled;
enable it for providers that require path-style addressing.

## 2. Crypto secrets

Litepod replaces the `{{base64_32}}`, `{{base64_64}}` and
`{{base64url_32}}` markers in `.env` with cryptographically random values when
the template is deployed. Back up the resulting values and do not regenerate
them during a redeploy. Losing them makes existing accounts permanently
unrecoverable.

## 3. Configure domains and public origins

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

In mobile and desktop apps, tap the onboarding-screen title seven times and
enter `ENTE_API_ORIGIN`.

## 4. Create the first account

Without SMTP, the sign-up verification code is written to the museum log:

```sh
podman compose logs ente-museum 2>&1 | grep -i 'verification code'
```

Set the `ENTE_SMTP_*` values in `.env` to email verification codes instead.

If uploads fail, confirm the variables reached museum with
`podman compose exec ente-museum env | grep ENTE_S3`, then verify endpoint reachability,
bucket permissions and CORS at the S3 provider.
