# Sending traces

Tempo accepts OTLP on two receivers, both reachable by service name from anywhere on the
Compose network:

| Protocol  | Endpoint                       |
| --------- | ------------------------------ |
| OTLP gRPC | `tempo:4317`                   |
| OTLP HTTP | `http://tempo:4318/v1/traces`  |

For an application instrumented with an OpenTelemetry SDK, that is one variable:

```sh
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

A collector (Grafana Alloy, the OpenTelemetry Collector) exports to the same endpoints.

# Querying

Add a **Tempo** data source in Grafana with URL `http://tempo:3200`. The `grafana` and
`grafana-loki-prometheus` templates in this catalog are the intended pair.

Search with TraceQL:

```
{resource.service.name="api" && duration > 500ms}
{span.http.status_code >= 500}
```

# TraceQL metrics

Tempo 3.0 answers metrics queries from the traces themselves — the live-store serves recent
data, the local blocks serve the rest. **No Prometheus and no metrics-generator are
needed** for this:

```
{resource.service.name="api"} | rate() by (span.http.status_code)
{} | quantile_over_time(duration, .95) by (resource.service.name)
{span.http.status_code >= 500} | count_over_time() by (resource.service.name)
```

In Grafana, run these against the Tempo data source (Explore → Tempo → TraceQL), not
against a Prometheus one.

Two knobs matter:

- `TEMPO_METRICS_MAX_DURATION` (default `24h`) caps the time range of a single metrics query.
- `query_frontend.metrics.query_backend_after` (Tempo's default, `15m`) is the boundary:
  ranges newer than that are answered by the live-store, older ones from stored blocks.

# Optional: span metrics and service graphs in Prometheus

The metrics-generator turns spans into RED metrics and a service graph and *remote-writes*
them, so it needs a Prometheus. It is off by default; Tempo logs
`metrics-generator is not configured` and runs fine without it. To enable it, deploy the
`prometheus` template on this network with `--web.enable-remote-write-receiver` added to its
`command:`, then uncomment the `metrics_generator:` block and the
`overrides.defaults.metrics_generator` block in `compose.yml`.

TraceQL metrics (above) do not depend on any of this.

# Storage and retention

Everything lives in the `tempo_data` volume mounted at `/var/tempo`: the WAL
(`/var/tempo/wal`), completed blocks (`/var/tempo/blocks`) and the live-store's own WAL
(`/var/tempo/live-store`). `TEMPO_BLOCK_RETENTION` (default `336h`, 14 days) is how long
blocks are kept before compaction drops them.

# Rootless

Runs rootless as-is. The config is injected as a compose `config` rather than a bind mount,
and the single writable path — `/var/tempo` — is pre-created in the image owned by uid
10001, so the fresh named volume inherits that ownership. Published ports are all above
1024.

# Why the version is pinned

The image tag is `3.0.3`, not `latest`. Tempo 3.0 replaced the ingester and compactor with
the live-store, block-builder and backend-scheduler, so a major bump is a config-breaking
event — pin it and upgrade deliberately.

The image is distroless: it has no shell, so there is no healthcheck in `compose.yml` and
`podman exec <container> sh` will not work. Readiness is `http://tempo:3200/ready`, checked
from another container.
