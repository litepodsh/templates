# Before deploying

Set `WG_EASY_INIT_HOST` to the public DNS name or IP address clients use to reach this server, and replace `WG_EASY_INIT_PASSWORD` with a long unique password. These initial settings are consumed only on the first start.

Assign a LitePod domain to the web UI. WireGuard itself still needs UDP `${WG_EASY_WIREGUARD_PORT}` open on the host for VPN clients.

This template is for **rootful** Podman. Load the host's `wireguard` and `nft_masq` kernel modules before starting it.
