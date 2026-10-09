## Before first boot

Anubis is an anti-bot gateway: visitors reach Anubis first, and Anubis
forwards approved requests to `ANUBIS_TARGET`. The template ships **no
website of its own**: Anubis boots with a placeholder target, and visitors get
a gateway error after the challenge until you point `ANUBIS_TARGET` at your
site (see [Point Anubis at your website](#point-anubis-at-your-website)).

Before making the service public, update these `.env` values:

- `ANUBIS_PUBLIC_DOMAIN` — the exact public hostname connected to the
  **anubis** service in litepod. **Without `http://`, `https://`, or a port.**
  Adding a scheme breaks cookies and redirects. For example, `app.example.com`
  (not `https://app.example.com`).
- `ANUBIS_TARGET` — the URL of the website Anubis should protect. It starts
  as the placeholder `http://my-site-a1b2c3-web:3000`; replace it.
- `ANUBIS_DIFFICULTY` — proof-of-work difficulty. `4` is the default; increase
  it carefully because higher values cost legitimate visitors more CPU time.
- `ANUBIS_PORT` — the direct host port for standalone use. litepod domains use
  Anubis's internal port `8923` instead.

> **Cookie and redirect domains must be bare hostnames.** Do not add a scheme
> (`https://` / `http://`). Wrong: `https://app.example.com`. Right:
> `app.example.com`. This is the most common configuration mistake.

The local default `ANUBIS_USE_REMOTE_ADDRESS=true` lets Anubis use the address
of a direct local request. Before routing public traffic through litepod Caddy,
set it to `false`: Caddy then supplies the visitor address through
`X-Forwarded-For`, which Anubis uses for its bot-policy decisions.

## Public domain and protected target

These values come from two different places and must not be exchanged:

- `ANUBIS_PUBLIC_DOMAIN` is the hostname connected to the **anubis** service
  in litepod Connectivity. Compose uses it for both Anubis `COOKIE_DOMAIN` and
  `REDIRECT_DOMAINS`, so the cookie hostname and permitted post-challenge
  redirect hostname cannot drift apart.
- `ANUBIS_TARGET` is the URL of the website Anubis protects. Prefer the
  internal network address (option A below); use an external URL only when
  the site does not run on this litepod server (option B).

## First boot

Run the template locally with Podman Compose:

```sh
podman compose -f templates/anubis/compose.yml \
  --env-file templates/anubis/.env up -d
```

Open <http://localhost:8923>. Anubis shows a browser challenge, then proxies
the request to `ANUBIS_TARGET`. With the placeholder target you get a gateway
error after the challenge, which confirms Anubis itself is working. Metrics listen on port
`9090` inside the Compose network only; they are deliberately not published on
the host. The healthcheck executes the Anubis binary directly and does not use
this port.

## Public domain in litepod

After creating this template through litepod:

1. Set `ANUBIS_PUBLIC_DOMAIN` to the hostname that will be connected to the
   **anubis** service, then add that hostname to the Anubis application.
2. Set `ANUBIS_USE_REMOTE_ADDRESS=false`, then save the environment changes.
3. In the application's **Connectivity** section, add a Caddy HTTP/HTTPS
   route for that domain and select service `anubis` with internal port `8923`.
4. Deploy or redeploy when litepod marks the application configuration stale.

litepod connects catalog-created Compose services to its shared
`litepod-network`, allowing Caddy to reach Anubis without a public host-port
mapping. The source `compose.yml` intentionally does not declare this external
network, so the template also works with plain local Podman Compose.

## Point Anubis at your website

Pick **one** option, set `ANUBIS_TARGET`, save, and redeploy Anubis.

### Option A — website deployed in litepod (internal network, recommended)

Use this when your website is another litepod application on the same server.
Traffic stays on litepod's internal `litepod-network` and never leaves the
host.

1. Deploy the website application first.
2. In litepod, open the website application and note its service's generated
   runtime name and its internal HTTP port (the container port, not a public
   host port).
3. Set `ANUBIS_TARGET` to that alias and port:

```toml
ANUBIS_TARGET = "http://<target-runtime-name>-<service>:<internal-port>"
```

For example, if litepod displays a target service with runtime name
`my-site-a1b2c3` and service name `web` on port `3000`, use:

```toml
ANUBIS_TARGET = "http://my-site-a1b2c3-web:3000"
```

4. Move the website's public domain to Anubis: remove the domain from the
   website application and add it to the **anubis** service (see
   [Public domain in litepod](#public-domain-in-litepod)). Otherwise visitors
   can still reach the site directly and skip the challenge.

Do not publish the website's HTTP port just for Anubis. Both applications are
already connected through litepod's internal network. Use `http://`, not
`https://`: internal traffic does not go through Caddy's TLS.

If you add the website as another service inside this same Compose file
instead, use its Compose service name and internal port, for example
`http://web:3000`.

### Option B — website hosted elsewhere (external network)

Use this when the website runs outside this litepod server (another VPS, a
PaaS, a managed host).

1. Give the origin its own hostname that is **different** from the public
   domain you will give Anubis, for example `origin.example.com` for the site
   and `app.example.com` for Anubis. Pointing `ANUBIS_TARGET` at Anubis's own
   domain makes Anubis proxy to itself in a loop.
2. Set `ANUBIS_TARGET` to the origin's full URL, including the scheme:

   ```toml
   ANUBIS_TARGET = "https://origin.example.com"
   ```

3. Point the public DNS record for `app.example.com` at this litepod server and
   add it to the **anubis** service (see
   [Public domain in litepod](#public-domain-in-litepod)).
4. Restrict the origin so it only accepts traffic from this litepod server's
   IP (firewall, security group, or the host's IP allowlist). Bots that find
   `origin.example.com` can otherwise skip Anubis entirely.

If the origin only answers to its public hostname (virtual hosting, many
PaaS providers), it may reject the request Anubis forwards. Check the upstream
[Anubis administrator documentation](https://anubis.techaro.lol/docs/admin/)
for the options that control the forwarded `Host` header and TLS server name,
and add them under `environment:` in `compose.yml`.

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
