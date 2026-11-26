Maple runs in a single container: OTLP ingest, the dashboard, the query API and an embedded ClickHouse, with all data in the `maple_data` volume. It serves one team on one replica, without alerting.

## Sign in

Open the app's URL and sign in with `MAPLE_LOCAL_ACCESS_TOKEN` from this app's environment. Everyone uses the same token and a sign-in lasts 30 days. There are no user accounts: to remove someone's access, change the token and redeploy.

## Send telemetry

Point your OpenTelemetry exporters at this app's URL and send the ingest key as a Bearer token:

```sh
export OTEL_EXPORTER_OTLP_ENDPOINT=https://<this app's domain>
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer%20<MAPLE_LOCAL_INGEST_KEY>"
```

Maple only takes OTLP over HTTP (protobuf or JSON), not gRPC. Some SDKs, such as Java and .NET, default to gRPC, so set the protocol explicitly.

## Query from the CLI

In this app's terminal, the `maple` CLI already has the token: `maple services`, `maple traces -s checkout --errors`. From your own machine, set `MAPLE_LOCAL_URL` to this app's URL and `MAPLE_LOCAL_ACCESS_TOKEN` to the token.

## Things to know

- **Restarts:** Maple writes its data cleanly only on a graceful shutdown; after a forced kill it restores its last checkpoint and drops the newer data. Prefer stopping and starting the app over killing it.
- **Sign-in throttling:** Maple throttles failed sign-ins and wrong ingest keys per client address. Behind LitePod's proxy every request comes from the same address, so 10 failures in a minute from anyone block new sign-ins and wrongly-keyed exporters for up to a minute. Browsers already signed in keep working.
- **Telemetry:** Maple sends its own traces and metrics to Maple by default. Set `MAPLE_TELEMETRY=off` to stop that. Your telemetry never leaves the server.
