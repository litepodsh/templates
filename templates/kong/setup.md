# Kong Gateway (OSS) + Kong Manager

This is the **community edition** — the `kong/kong` image, not the Enterprise
`kong/kong-gateway`. Kong Manager, the admin web UI, is bundled in the OSS image
and served on port **8002**.

## Services

| Service | Role |
| ------- | ---- |
| `db` | PostgreSQL — required for Kong Manager to *write* config (DB-less mode is read-only) |
| `kong-migrations` | one-shot `kong migrations bootstrap`; runs once, then exits 0 on every later `up` |
| `kong` | the gateway: proxy `:8000`, Admin API `:8001`, Kong Manager `:8002` |

## Making the UI work

Kong Manager is a browser app on `:8002` that sends every request to the **Admin
API on `:8001` from the client side**. If the browser cannot reach the URL in
`KONG_ADMIN_URL`, the UI loads but every list and form stays empty or errors.

Two ways to satisfy that — host ports are **not** required:

1. **Publish the ports.** Uncomment the `ports:` block in `compose.yml`. Keep
   `KONG_ADMIN_URL` / `KONG_MANAGER_URL` as `http://localhost:800x`, or set them
   to `http://<server-ip>:800x` when browsing from another machine.
2. **Front it with a proxy.** Route two hostnames to this service
   (`kong:8001` and `kong:8002`) and set `KONG_ADMIN_URL` /
   `KONG_MANAGER_URL` to those `https://` hostnames. Setting
   `KONG_ADMIN_GUI_API_URL` also makes Kong emit the CORS headers the
   cross-origin UI needs.

## Security

The OSS Kong Manager and Admin API have **no authentication**. Never expose
`:8001` or `:8002` to the public internet without putting auth (proxy basic auth,
mTLS, IP allow-list, VPN) in front. Port `:8000` is the public one — that is
where the APIs you configure are served.

## First check

```sh
# create a service + route via the Admin API
curl -s localhost:8001/services -d name=example -d url=https://httpbin.org
curl -s localhost:8001/services/example/routes -d paths[]=/example
curl -s localhost:8000/example/get      # proxied through Kong
```

The same objects appear immediately in Kong Manager.
