# Authentication

changedetection.io ships its own password login. Choose how much protection
you need before exposing it:

## Option A — built-in password (recommended)

Open the **Settings** tab, set the **password** field, and save. The UI now
asks for that single shared password on every request.

- Uses only the app itself — no extra container, works unchanged behind
  litepod's Caddy.
- The password lives in the datastore and survives restarts.
- Left unset, the app is **completely open** to anyone with network access.
  The project's security advisory GHSA-3c45-4pj5-ch7m (SSRF via watch URLs)
  explicitly warns that no authentication is required by default — do not
  expose an unprotected install publicly.

Forgot the password? Create `removepassword.lock` inside `/datastore` and
restart:

```sh
podman exec changedetection touch /datastore/removepassword.lock
podman restart changedetection
```

## Option B — Caddy basic auth (litepod)

For a public domain, add HTTP basic auth to the Caddy route of this
application in litepod's **Connectivity** section. The proxy answers with a
credentials prompt before any request reaches changedetection.io, so even the
login screen of the app stays hidden.

- One shared basic-auth password per domain, managed in litepod, not in this
  template.
- Combine with Option A for defense in depth, or use either alone.

## Public URL

Set `CHANGEDETECTION_BASE_URL` in `.env` to the domain litepod routes to this
container (for example `https://cd.example.com`). Without it, notification
alert links and generated absolute URLs point at the internal address instead
of the public domain.