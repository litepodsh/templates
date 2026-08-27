# Before deploying

Replace the generated secrets in `.env`:

- `GARAGE_RPC_SECRET` — **must be a 32-byte hex string** (64 hex characters:
  `openssl rand -hex 32`). Garage refuses to start otherwise.
- `GARAGE_ADMIN_TOKEN`, `GARAGE_METRICS_TOKEN` — bearer tokens for the admin and
  metrics APIs.
- `GARAGE_WEBUI_AUTH_USER_PASS` — `user:password` for the web UI login.

The config file is inlined in `compose.yml` as a compose `config` and shared by
both containers, so there is no `garage.toml` on disk to edit — change values
through `.env`.

# After first deploy: create the cluster layout

A fresh Garage node has no storage layout, so it will not accept any data until
you assign one. One-time, run inside the `garage` container:

```sh
# 1. Get this node's ID
/garage status

# 2. Assign it a zone and capacity (use the ID from step 1)
/garage layout assign -z dc1 -c 10G <node-id>

# 3. Apply
/garage layout apply --version 1
```

# Buckets and keys

Use the web UI (`:3909`), or the CLI inside the `garage` container:

```sh
/garage bucket create my-bucket
/garage key create my-app-key
/garage bucket allow --read --write my-bucket --key my-app-key
```

S3 endpoint for clients: `http://garage:3900` on the Compose network (or the
proxied host), region `garage`, path-style addressing.
