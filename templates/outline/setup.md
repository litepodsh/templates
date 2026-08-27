# Authentication is required

Outline has **no built-in email/password login**. It will start, but nobody can
sign in until you configure at least one SSO provider. Pick one:

## Generic OIDC (Authentik, Keycloak, Zitadel, Auth0, …)

Fill in `.env`:

```
OUTLINE_OIDC_CLIENT_ID=...
OUTLINE_OIDC_CLIENT_SECRET=...
OUTLINE_OIDC_AUTH_URI=https://idp.example.com/application/o/authorize/
OUTLINE_OIDC_TOKEN_URI=https://idp.example.com/application/o/token/
OUTLINE_OIDC_USERINFO_URI=https://idp.example.com/application/o/userinfo/
```

Register `${OUTLINE_URL}/auth/oidc.callback` as the redirect URI with your
provider.

## Google / Slack / Azure

Remove the `OIDC_*` lines from `compose.yml` and add the provider's pair
instead, e.g. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (redirect URI
`${OUTLINE_URL}/auth/google.callback`). See
<https://docs.getoutline.com/s/hosting/doc/authentication>.

# Storage & secrets

`FILE_STORAGE=local` keeps uploads in the `outline_data` volume
(`/var/lib/outline/data`); switch to `s3` and set the `AWS_*` variables to use
object storage. `OUTLINE_SECRET_KEY` and `OUTLINE_UTILS_SECRET` are each
`openssl rand -hex 32`; `OUTLINE_SECRET_KEY` encrypts data at rest, so back it
up.

Migrations run automatically on start. The first user to sign in becomes an
admin.
