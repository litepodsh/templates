# Before deploying

Set `ANYTYPE_EXTERNAL_ADDR` to the address clients use to reach this node: an IP, a domain, or both comma-separated (e.g. `sync.example.com,203.0.113.5`). It must be reachable from wherever your Anytype apps run.

# After deploying

The bundle writes a client config to `/data/client-config.yml` inside the container on first start. Import it into the Anytype app (Settings → Preferences → Network).

Grab it any of these ways:

- **LitePod Terminal tab** — open the service's Terminal tab and run `cat /data/client-config.yml`, then copy the output.
- **LitePod Volumes tab** — browse the `anytype_data` volume and download `client-config.yml` directly.
- **Docker**, from a shell:
  ```bash
  docker cp <container-id>:/data/client-config.yml ./client-config.yml
  ```
- **Podman**, from a shell:
  ```bash
  podman cp <container-id>:/data/client-config.yml ./client-config.yml
  ```

Find `<container-id>` with `docker ps` or `podman ps`.
