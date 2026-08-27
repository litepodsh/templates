# Before deploying

## `DOMAIN`

Set `VAULTWARDEN_DOMAIN` to the exact external URL you serve the vault from,
including the scheme (`https://vault.example.com`). Passkeys, WebAuthn and U2F
two-factor all break if it is wrong or left as `localhost`.

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
