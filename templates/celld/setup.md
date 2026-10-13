## What this is

celld runs Cloudflare Workers applications (Workers, Durable Objects, KV,
Queues, D1, R2, Workflows, Cron Triggers, static assets) on your own machine.
Each Durable Object is a cell with its own SQLite database. Long-term state
lives in an S3-compatible bucket; this template runs one celld node.

## Before first boot

celld needs an object store you provide. It must support conditional writes,
exact ranged reads and read-after-write consistency. Amazon S3, Cloudflare R2,
Tigris and Google Cloud Storage qualify. Community MinIO is not qualified for
production, and Backblaze B2, Hetzner and DigitalOcean Spaces do not qualify.

Set in `.env`:

- `CELLD_BUCKET` — `s3://YOUR-BUCKET`, optionally with a `/PREFIX`.
- `S3_ENDPOINT` — endpoint URL for R2 or other S3-compatible stores. Empty for
  Amazon S3.
- `AWS_REGION` — `auto` for R2.
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — bucket credentials. Keep them
  secret; they control all fleet state.

For `gs://` or `az://` buckets, remove the unused `S3_ENDPOINT`/`AWS_*`
variables and pass the provider's credential variables instead (see the
[celld docs](https://celld.dev/docs)).

## First boot

```sh
podman compose -f templates/celld/compose.yml \
  --env-file templates/celld/.env up -d
```

The node starts with no application. Public health is at
`/.well-known/celld/health`.

## Deploy an application

Deploy from a machine with celld and `esbuild` installed, into the same bucket:

```sh
curl -fsSL https://celld.dev/install.sh | sh
git clone https://github.com/denoland/celld
cd celld/examples/counter
celld deploy . \
  --bucket "$CELLD_BUCKET" \
  --endpoint "$S3_ENDPOINT" \
  --region "$AWS_REGION"
```

The node adopts the new deployment within `CELLD_DEPLOY_POLL_S` seconds, then
serves it on <http://localhost:8080>.

## Single node note

With one node there is no peer to replicate to, so every write waits for the
bucket and is slower. Run more nodes against the same bucket for faster writes
and failover (see the celld docs).

## Public domain in litepod

In the application's **Connectivity** section, add a Caddy HTTP/HTTPS route
for your domain, select service `celld`, internal port `8080`, then redeploy.
The peer/operator listener stays on loopback inside the container.

## Data and reset

Local SQLite and replication work files live in the `celld_state` volume;
durable state is in your bucket. Remove the local volume with:

```sh
podman compose -f templates/celld/compose.yml down -v
```
