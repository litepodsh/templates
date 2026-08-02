## Before first boot

Anubis is an anti-bot gateway: visitors reach Anubis first, and Anubis
forwards approved requests to `ANUBIS_TARGET`. The bundled `demo-web` Nginx
service is private and provides a working target for a new deployment.

Before making the service public, update these `.env` values:

- `ANUBIS_PUBLIC_DOMAIN` — the exact public hostname connected to the
  **anubis** service in LitePod. **Without `http://`, `https://`, or a port.**
  Adding a scheme breaks cookies and redirects. For example, `app.example.com`
  (not `https://app.example.com`).
- `ANUBIS_TARGET` — the internal HTTP URL of the service Anubis should
  protect. It starts as `http://demo-web:80` so you can verify the template
  immediately.
- `ANUBIS_DIFFICULTY` — proof-of-work difficulty. `4` is the default; increase
  it carefully because higher values cost legitimate visitors more CPU time.
- `ANUBIS_PORT` — the direct host port for standalone use. LitePod domains use
  Anubis's internal port `8923` instead.

> **Cookie and redirect domains must be bare hostnames.** Do not add a scheme
> (`https://` / `http://`). Wrong: `https://app.example.com`. Right:
> `app.example.com`. This is the most common configuration mistake.

The local default `ANUBIS_USE_REMOTE_ADDRESS=true` lets Anubis use the address
of a direct local request. Before routing public traffic through LitePod Caddy,
set it to `false`: Caddy then supplies the visitor address through
`X-Forwarded-For`, which Anubis uses for its bot-policy decisions.

## Public domain and protected target

These values come from two different places and must not be exchanged:

- `ANUBIS_PUBLIC_DOMAIN` is the hostname connected to the **anubis** service
  in LitePod Connectivity. Compose uses it for both Anubis `COOKIE_DOMAIN` and
  `REDIRECT_DOMAINS`, so the cookie hostname and permitted post-challenge
  redirect hostname cannot drift apart.
- `ANUBIS_TARGET` is the internal HTTP URL of the service Anubis protects. Use
  its LitePod/Compose network alias and internal port, such as
  `http://my-site-a1b2c3-web:3000`. Do not use that application's public
  hostname and do not publish its port merely for Anubis.

For the bundled example, the public domain is whichever hostname is assigned
to Anubis and the internal target is `http://demo-web:80`.

## First boot

Run the template locally with Podman Compose:

```sh
podman compose -f templates/anubis/compose.yml \
  --env-file templates/anubis/.env up -d
```

Open <http://localhost:8923>. Anubis may show a browser challenge before it
proxies the request to the private Nginx demo page. Metrics listen on port
`9090` inside the Compose network only; they are deliberately not published on
the host. The healthcheck executes the Anubis binary directly and does not use
this port.

## Public domain in LitePod

After creating this template through LitePod:

1. Set `ANUBIS_PUBLIC_DOMAIN` to the hostname that will be connected to the
   **anubis** service, then add that hostname to the Anubis application.
2. Set `ANUBIS_USE_REMOTE_ADDRESS=false`, then save the environment changes.
3. In the application's **Connectivity** section, add a Caddy HTTP/HTTPS
   route for that domain and select service `anubis` with internal port `8923`.
4. Deploy or redeploy when LitePod marks the application configuration stale.

LitePod connects catalog-created Compose services to its shared
`litepod-network`, allowing Caddy to reach Anubis without a public host-port
mapping. The source `compose.yml` intentionally does not declare this external
network, so the template also works with plain local Podman Compose.

## Protect another LitePod application

To proxy to a deployed Compose application in the same LitePod project, first
deploy the target application. In LitePod, find the target service's generated
runtime container name and its internal HTTP port. LitePod puts that service on
the same `litepod-network` and gives it the same stable network alias.

Set `ANUBIS_TARGET` to that alias and port, then redeploy Anubis:

```toml
ANUBIS_TARGET = "http://<target-runtime-name>-<service>:<internal-port>"
```

For example, if LitePod displays a target service with runtime name
`my-site-a1b2c3` and service name `web` on port `3000`, use:

```toml
ANUBIS_TARGET = "http://my-site-a1b2c3-web:3000"
```

Do not publish the target application's HTTP port just for Anubis. Both
applications are already connected through LitePod's internal network. If the
target is a different service in the same Compose application, use its Compose
service name and internal port instead.

## Policy

This template uses the default bot policy bundled with the Anubis image, so it
does not require a host bind mount. For custom policies, challenge behavior,
or crawler allowlists, follow the upstream [Anubis administrator
documentation](https://anubis.techaro.lol/docs/admin/).

## Reset

The template has no persistent application data. Stop the standalone example
with:

```sh
podman compose -f templates/anubis/compose.yml down
```
