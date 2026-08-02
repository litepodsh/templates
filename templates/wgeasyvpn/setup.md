# Before deploying

Set `WG_EASY_INIT_HOST` to the public DNS name or IP address clients use to reach this server, and replace `WG_EASY_INIT_PASSWORD` with a long unique password. The initial settings are consumed only on the first container start; remove the `WG_EASY_INIT_*` variables from your deployed environment afterwards if you do not want the initial password retained there.

This template is for **rootful** Podman. Load the host's `wireguard` and `nft_masq` kernel modules before starting it, then allow UDP `${WG_EASY_WIREGUARD_PORT}` through the host firewall. The persistent named volume means no host directory needs to be created.

The UI is initially available over HTTP so it works without a reverse proxy. Set `WG_EASY_INSECURE=false` when serving the UI through HTTPS. IPv6 is disabled by default; enable it only after configuring IPv6 networking on the host and the VPN clients.
