# First boot

On first start the container runs `ocis init` (writes `/etc/ocis/ocis.yaml` with
random secrets) and then `ocis server`. Log in with user `admin` and the
`OCIS_ADMIN_PASSWORD` from `.env`, then change it in the user menu.

# HTTPS required

oCIS requires HTTPS — its identity provider (OIDC issuer) refuses to start with
an `http://` URL. Attach a domain with a certificate to the route; `OCIS_URL`
({{url}}) then resolves to `https://…`. LitePod terminates TLS in front of the
container (`PROXY_TLS=false`).

# Data

User files live in the `ocis_data` volume (`/var/lib/ocis`); the generated
configuration (including service secrets) lives in `ocis_config` (`/etc/ocis`).
Back up both volumes.
