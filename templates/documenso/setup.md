# Signing certificate (required)

Documenso signs every completed document with a PKCS#12 (`.p12`) certificate. It
expects one at `/opt/documenso/cert.p12`, inside the `documenso_data` volume.
Without it, documents can be prepared and sent but never completed.

## Reuse the Let's Encrypt certificate from Caddy

LitePod's Caddy already obtains and renews a Let's Encrypt certificate for the
domain Documenso is served on. Convert that certificate + key into a `.p12` and
place it in the `documenso_data` volume as `cert.p12`.

Caddy stores them under its data directory, e.g.:

```
/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/<domain>/<domain>.crt
/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/<domain>/<domain>.key
```

Bundle them (leave the export passphrase empty, or set one and put it in
`DOCUMENSO_SIGNING_PASSPHRASE`):

```sh
openssl pkcs12 -export \
  -in  <domain>.crt \
  -inkey <domain>.key \
  -out cert.p12 \
  -passout pass:
```

Drop the resulting `cert.p12` into the `documenso_data` volume at
`/opt/documenso/cert.p12` and restart the `documenso` service. Repeat after each
Let's Encrypt renewal (~90 days), ideally from Caddy's renewal hook.

# Secrets

`DOCUMENSO_ENCRYPTION_KEY` and `DOCUMENSO_ENCRYPTION_SECONDARY_KEY` must each be
32+ characters and encrypt 2FA secrets and API tokens at rest. Keep a backup —
rotating them invalidates that data.

# URLs & mail

Set `DOCUMENSO_WEBAPP_URL` to the real external URL. SMTP (`DOCUMENSO_SMTP_*`) is
required for sending signing invitations; point it at your provider or the
`mailpit` template for testing.
