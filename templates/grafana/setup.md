# Optional Loki and Prometheus

Grafana runs on its own by default. The Compose file includes **commented** Loki and Prometheus services; uncomment each service and its matching named volumes to enable it.

After enabling Loki, add `http://loki:3100` as a Loki data source in Grafana. After enabling Prometheus, add `http://prometheus:9090` as a Prometheus data source. `prometheus.yml` is a real file in the `prometheus_config` volume mounted at `/etc/prometheus`, seeded on first start with the image's self-scrape default; edit it (LitePod's volume file editor, or `podman exec <container> cat /etc/prometheus/prometheus.yml`) to add scrape jobs and apply without a restart via `wget -q --post-data='' http://prometheus:9090/-/reload` (`--web.enable-lifecycle` is set). For a standalone metrics store use the dedicated `prometheus` template.

Replace `GRAFANA_ADMIN_PASSWORD` before deployment. The tracked `.env` contains a placeholder only.
