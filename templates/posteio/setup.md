# Licensing

The free Poste.io image is **closed-source freeware**, not open source. Paid
tiers unlock additional features. Review <https://poste.io> before relying on it.

# DNS (do this first)

A working mail server needs, for `mail.example.com` serving `example.com`:

- **A** record: `mail.example.com` → your public IP
- **PTR** (reverse DNS) for that IP → `mail.example.com` (set at your host/ISP)
- **MX** record: `example.com` → `mail.example.com`
- **SPF**: `example.com TXT "v=spf1 mx ~all"`
- **DKIM**: enable the domain in the Poste.io admin UI, then publish the TXT
  record it generates
- **DMARC**: `_dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com"`

Port 25 must be reachable inbound and allowed outbound — many cloud providers
block it by default and require a support request.

# Ports 80 / 443 and LitePod's Caddy

You do **not** publish host `80` / `443` for this template. Caddy owns `443`,
does the HTTP→HTTPS redirect, and reverse-proxies the admin UI / webmail to the
container's plain-HTTP port `80` over the Compose network (`HTTPS=OFF` tells
Poste.io to trust the proxy). That covers all web traffic and redirection.

The mail ports (`25`, `465`, `587`, `143`, `993`, `110`, `995`) are still mapped
directly on the host — Caddy is an HTTP proxy and cannot carry SMTP/IMAP/POP.

# First run

Reach `/admin` through the domain Caddy routes to this container and complete the
first-run wizard (creates the admin account and the first domain). All mailboxes,
config, TLS certs and logs live in the `posteio_data` volume.

# TLS for the mail ports

The web side is handled by Caddy. The mail ports (`465`/`587`/`993`/…) present
Poste.io's *own* certificate. Two options:

1. **Reuse Caddy's certificate** (recommended, no extra ports). Caddy already
   holds a Let's Encrypt cert for the mail hostname; copy it into the
   `posteio_data` volume at `/data/ssl/server.crt` + `/data/ssl/server.key` (or
   import it in the admin UI) and re-copy after each renewal — same pattern as
   the `documenso` template.
2. **Let Poste.io run its own ACME.** Uncomment the `${POSTEIO_HTTP_PORT}:80`
   mapping in `compose.yml` so the HTTP-01 challenge on the mail hostname can
   reach the container, then request the certificate from the admin UI. This
   means Poste.io, not Caddy, must answer port 80 for that hostname.

# Resources

ClamAV alone uses roughly 1 GB RAM. On a small host set
`POSTEIO_DISABLE_CLAMAV=TRUE`.
