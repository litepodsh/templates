# What's running

Three services on the same Compose network:

| Service      | In-network URL           | What it is                |
| ------------ | ------------------------ | ------------------------- |
| `grafana`    | `http://grafana:3000`    | dashboards, the UI you use |
| `loki`       | `http://loki:3100`       | log store                 |
| `prometheus` | `http://prometheus:9090` | metrics store             |

Replace `GRAFANA_ADMIN_PASSWORD` before deployment. The tracked `.env` contains a
placeholder only.

# Add the data sources

Grafana starts with no data sources. In **Connections → Data sources → Add data source**:

- **Prometheus** → URL `http://prometheus:9090`
- **Loki** → URL `http://loki:3100`

Use the service names, not `localhost` — each container's `localhost` is its own.

# Sending logs to Loki

Loki only stores logs; it does not collect them. Point a collector (Grafana Alloy,
Promtail, or the Docker/Podman Loki log driver) at:

```
http://loki:3100/loki/api/v1/push
```

Logs land in the `loki_data` volume, mounted at `/loki` — the path the image's default
config (`/etc/loki/local-config.yaml`) uses for chunks, index and rules.

# Editing the Prometheus config

`prometheus.yml` is a real file in the **`prometheus_config`** volume, mounted at
`/etc/prometheus`. On the first start the container copies the image's default config into
the empty volume; after that it is yours to edit — through LitePod's volume file editor, or:

```sh
podman exec <container> cat /etc/prometheus/prometheus.yml
```

The shipped default only scrapes Prometheus itself. Add scrape jobs and apply without a
restart:

```sh
wget -q --post-data='' http://prometheus:9090/-/reload
```

`--web.enable-lifecycle` is set so `/-/reload` works. Targets are addressed by Compose
service name on the shared network, e.g. `node-exporter:9100`. Alerting rule files can live
in the same volume, e.g. `/etc/prometheus/rules/*.yml` referenced from `rule_files:`.

`PROMETHEUS_RETENTION_TIME` (default `15d`) bounds how long samples are kept in the
`prometheus_data` volume.

# Rootless

The stack runs rootless as-is. Every service writes only to a named volume whose mount
point already exists in the image (`/var/lib/grafana` uid 472, `/loki` uid 10001,
`/prometheus` and `/etc/prometheus` uid 65534), so the volume inherits the right ownership
on first start. All published ports are above 1024. Do not swap a volume for a bind mount
and do not move a mount point — either one hands the process a root-owned directory it
cannot write to.

# Smaller pieces

Want only one of these? The catalog also has the standalone `grafana`, `prometheus` and
`tempo` (traces) templates.
