# What this template runs

Just the CrowdSec engine and its Local API (LAPI). Detection scenarios only fire
if you feed the engine logs, and blocking only happens if a **bouncer** enforces
the LAPI's decisions. Both are deployment-specific and configured outside this
template.

## Acquisition sources

CrowdSec parses logs listed in `/etc/crowdsec/acquis.yaml` or
`/etc/crowdsec/acquis.d/*.yaml`. Options, roughly in order of preference here:

- **Read from another container** — have the app that produces the logs also
  write them to a shared named volume, mount that volume into the `crowdsec`
  service, and add an acquis file pointing at the path.
- **Syslog / journald input** — configure a `source: syslog` or
  `source: journalctl` acquisition (see the CrowdSec docs).
- **Host log files** — if your deployment allows it, add a read-only bind mount
  (`/var/log/nginx:/var/log/nginx:ro`) and an acquis file. This departs from the
  catalog's named-volume rule, so it is not shipped by default.

## Bouncers

Issue a key per bouncer, in the running `crowdsec` container:

```sh
cscli bouncers add my-nginx-bouncer
```

Configure the bouncer (nginx, Caddy, firewall, …) with that key and the LAPI URL
`http://crowdsec:8080`.

## Console enrollment (optional)

```sh
cscli console enroll <your-enroll-key>
```

Config and the scenario/parser hub live in `crowdsec_config`; the decision
database and geo-IP data live in `crowdsec_data`.
