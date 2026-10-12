# Before deploying

## `DOMAIN`

`VAULTWARDEN_DOMAIN` is `{{url}}`: LitePod fills it with the app's domain on
every deploy. Add your own HTTPS domain (`https://vault.example.com`) and
redeploy — the web vault, passkeys, WebAuthn and U2F two-factor need HTTPS and
break on the generated plain-http address. Outside LitePod, set it to that
exact external URL.

## `ADMIN_TOKEN`

The `/admin` panel is enabled whenever `VAULTWARDEN_ADMIN_TOKEN` is non-empty.
Prefer an Argon2 PHC hash over a plain token — generate one with:

```sh
podman run --rm -it docker.io/vaultwarden/server:latest /vaultwarden hash
```

Paste the resulting `$argon2id$...` string into `VAULTWARDEN_ADMIN_TOKEN`. In an
`.env` file every literal `$` must be written `$$`, or wrap the whole value in
single quotes. Leave the variable empty to disable the admin panel entirely.

## Registration

`VAULTWARDEN_SIGNUPS_ALLOWED=false` ships by default. Set it to `true` only long
enough to create your first account, then set it back. New users can still be
added from `/admin` or by email invitation.

All state (SQLite database, attachments, RSA keys) lives in the
`vaultwarden_data` volume.
