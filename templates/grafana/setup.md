# Grafana on its own

This template is Grafana and nothing else — it ships with no data source, so the first
thing to do after logging in is **Connections → Data sources → Add data source**.

Deploy a store alongside it and address it by Compose service name on the shared network:

| Template                   | Data source type | URL                      |
| -------------------------- | ---------------- | ------------------------ |
| `prometheus`               | Prometheus       | `http://prometheus:9090` |
| `tempo`                    | Tempo            | `http://tempo:3200`      |
| `grafana-loki-prometheus`  | Loki             | `http://loki:3100`       |

Never `localhost` — inside a container that is the container itself.

For Grafana with a log store and a metrics store already wired up, use the
`grafana-loki-prometheus` template instead.

# Rootless

Runs rootless as-is: the only writable path is the `grafana_data` named volume mounted at
`/var/lib/grafana`, which exists in the image owned by uid 472, so the fresh volume
inherits that ownership on first start. The published port (3000) is above 1024. Replacing
the volume with a bind mount breaks this.

Replace `GRAFANA_ADMIN_PASSWORD` before deployment. The tracked `.env` contains a
placeholder only.
