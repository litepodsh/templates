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
| `ENTE_S3_REGION` | Provider region, for example `us-east-1` |
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

## 2. Generate the crypto secrets

`.env` ships these empty, and museum will not start until they are set:

```sh
echo "ENTE_KEY_ENCRYPTION=$(openssl rand -base64 32)"
echo "ENTE_KEY_HASH=$(openssl rand -base64 64)"
echo "ENTE_JWT_SECRET=$(openssl rand -base64 32)"
```

Paste the values into `.env` and back them up. Losing them makes existing
accounts permanently unrecoverable.

## 3. Configure public origins

- `ENTE_API_ORIGIN` is the museum URL as browsers and native clients reach it.
  Publish port 8080 or route a hostname to `museum:8080`.
- `ENTE_ALBUMS_ORIGIN` is the public Albums URL served by the web container on
  port 3002.

In mobile and desktop apps, tap the onboarding-screen title seven times and
enter `ENTE_API_ORIGIN`.

## 4. Create the first account

Without SMTP, the sign-up verification code is written to the museum log:

```sh
podman logs ente_museum_1 2>&1 | grep -i 'verification code'
```

Set the `ENTE_SMTP_*` values in `.env` to email verification codes instead.

If uploads fail, confirm the variables reached museum with
`podman exec ente_museum_1 env | grep ENTE_S3`, then verify endpoint reachability,
bucket permissions and CORS at the S3 provider.
