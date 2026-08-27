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

# First run

Open `http://<host>:<POSTEIO_HTTP_PORT>/admin` and complete the first-run wizard
(creates the admin account and the first domain). All mailboxes, config, TLS
certs and logs live in the `posteio_data` volume.

# TLS

With `POSTEIO_HTTPS=OFF` Poste.io serves the UI/webmail over plain HTTP and
expects LitePod's reverse proxy to add TLS. For the mail ports it can obtain its
own Let's Encrypt certificate from the admin UI (needs port 80 reachable), or you
can import certificates there.

# Resources

ClamAV alone uses roughly 1 GB RAM. On a small host set
`POSTEIO_DISABLE_CLAMAV=TRUE`.
