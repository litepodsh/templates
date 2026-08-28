# Scrape targets

The config is inlined in `compose.yml` under `x-prometheus-config`. Out of the
box it only scrapes Prometheus itself. Add jobs there and either redeploy or
reload live:

```sh
# from inside the container (or any host that can reach it)
wget -q --post-data='' http://prometheus:9090/-/reload
```

`--web.enable-lifecycle` is set so `/-/reload` works.

Targets are addressed by Compose service name on the shared network, e.g. a
`node-exporter` service is `node-exporter:9100`.

# Grafana

This is the metrics store; point a Grafana instance at
`http://prometheus:9090` as a Prometheus data source. The `grafana` template in
this catalog is the intended pair.

# Retention

`PROMETHEUS_RETENTION_TIME` (default `15d`) bounds how long samples are kept in
the `prometheus_data` volume. Raise it for longer history, at the cost of disk.

# Reset

All series data lives in `prometheus_data`.
