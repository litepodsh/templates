# Orbit

One container. A Rust server serves the API and the embedded React app; data
lives in SQLite under the `orbit_data` volume, together with attachments. Local
backups go to `orbit_backups`.

## 1. HTTPS is required before the first start

Orbit runs with `ORBIT_ENV=production`, which **refuses to start** unless
`ORBIT_PUBLIC_ORIGIN` is an `https://` origin and at least one trusted proxy is
set. LitePod's generated `*.sslip.io` domains are plain http, so attach a custom
domain with a certificate to this app's web route before deploying, or the
container exits with:

```
production mode requires an https public origin
```

`ORBIT_PUBLIC_ORIGIN` is bound to `{{url}}`: it follows the domain you attach,
on every redeploy.

## 2. Complete the first-run setup

The first boot prints a one-time setup URL to the container log:

```sh
podman compose logs orbit | grep 'Initial setup URL'
```

Open it and create the workspace and its owner. That account becomes the root
user and cannot be suspended or removed. Setup can run only once. If the token
is lost, stop the container and mint a new one:

```sh
podman compose stop orbit
podman compose run --rm orbit setup-token rotate
podman compose start orbit
```

## 3. Back up the app key

`ORBIT_APP_KEY` is generated from `{{base64_32}}` and encrypts the secrets Orbit
saves in its database: the SMTP password, S3 keys, OAuth client secrets and
two-factor settings. Keep a copy outside the server and outside its backups — a
restored database without the same key cannot read those secrets, and people
with 2FA must set it up again.

## 4. Configure the instance

Everything else lives in the app, not in `.env`:

- **Admin → Settings → Email** — SMTP for invitations, sign-up links and
  password resets. Without it invitations are shared as links and recovery is a
  manual admin action.
- **Admin → Settings → Limits** — workspaces per account and storage per
  workspace.
- **Admin → Storage** — S3-compatible bucket for attachments and off-server
  backups, plus automatic backups (hourly or daily).
- **Admin → Sign-in providers** — Google or GitHub OAuth. Register the callback
  URL `https://<your-domain>/api/v1/auth/providers/{google|github}/callback`.

Registration stays closed after setup; people join by invitation.

## 5. Agentic clients (MCP)

**Account → Agentic** has the MCP endpoint (`https://<your-domain>/mcp`) and an
OAuth flow for AI clients, plus API-token access. See
[`docs/mcp.md`](https://github.com/coollabsio/orbit/blob/main/docs/mcp.md).

## Backups and restore

Local backups land in the `orbit_backups` volume; with **Backups in S3** turned
on, new ones go to the bucket instead and leave the volume. Schedule and manage
them in **Admin → Backups** while Orbit runs. A single page or task can be
recovered from a backup there too, without stopping anything.

The CLI takes an exclusive lock on the SQLite database, so stop Orbit and run it
in a one-off container with the same environment:

```sh
podman compose stop orbit
podman compose run --rm orbit backup create
podman compose run --rm orbit backup list
podman compose run --rm orbit backup restore <id>
podman compose start orbit
```

A restore replaces the whole database; data written after the backup is lost.
Backups created this way also include the pre-migration snapshot Orbit takes
before schema upgrades.
