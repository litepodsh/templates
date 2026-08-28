# Editing the config

`prometheus.yml` is a real file in the **`prometheus_config`** volume, mounted at
`/etc/prometheus`. On the first start the container copies the image's default
config into the empty volume; after that it is yours to edit — through LitePod's
volume file editor, or:

```sh
# from any host that can reach the container
podman exec <container> cat /etc/prometheus/prometheus.yml
```

The shipped default only scrapes Prometheus itself. Add scrape jobs and apply
without a restart:

```sh
wget -q --post-data='' http://prometheus:9090/-/reload
```

`--web.enable-lifecycle` is set so `/-/reload` works. Targets are addressed by
Compose service name on the shared network, e.g. `node-exporter:9100`. Alerting
rule files can live in the same volume, e.g. `/etc/prometheus/rules/*.yml`
referenced from `rule_files:`.

# Grafana

This is the metrics store; add it as a Prometheus data source in Grafana at
`http://prometheus:9090`. The `grafana` template in this catalog is the intended
pair.

# Retention

`PROMETHEUS_RETENTION_TIME` (default `15d`) bounds how long samples are kept in
the `prometheus_data` volume. Raise it for longer history, at the cost of disk.
