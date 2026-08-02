# Optional Loki and Prometheus

Grafana runs on its own by default. The Compose file includes **commented** Loki and Prometheus services; uncomment each service and its matching named volume to enable it.

After enabling Loki, add `http://loki:3100` as a Loki data source in Grafana. After enabling Prometheus, add `http://prometheus:9090` as a Prometheus data source. The built-in Prometheus configuration initially scrapes Prometheus itself; add your own scrape targets from Grafana's data-source settings or by providing a tailored Prometheus configuration in your deployment.

Replace `GRAFANA_ADMIN_PASSWORD` before deployment. The tracked `.env` contains a placeholder only.
