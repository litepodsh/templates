# Before deploying

Set `WG_EASY_INIT_HOST` to the public DNS name or IP address clients use to reach this server, and replace `WG_EASY_INIT_PASSWORD` with a long unique password. These initial settings are consumed only on the first start.

Assign a LitePod domain to the web UI. WireGuard itself still needs UDP `${WG_EASY_WIREGUARD_PORT}` open on the host for VPN clients.

## Rootless Podman host setup

If this service runs with rootless Podman, run the following as `root` before
deploying. Follow only the comments for the server's distribution.

```sh
# All distributions: load the WireGuard and IPv4 firewall modules now and at boot.
modprobe wireguard nft_masq ip_tables iptable_filter iptable_nat xt_MASQUERADE
printf '%s\n' wireguard nft_masq ip_tables iptable_filter iptable_nat xt_MASQUERADE \
  > /etc/modules-load.d/wg-easy.conf

# Ubuntu 26.04 only, and only if logs show "readlink: Permission denied"
# or AppArmor denies wg-quick access to /bin/busybox.
# apt install -y apparmor-utils
# find /etc/apparmor.d -type f -name '*wg-quick*' -print
# If the previous command returns /etc/apparmor.d/wg-quick, run:
# aa-complain /etc/apparmor.d/wg-quick

# Fedora only: do not use aa-complain. Inspect SELinux denials if WireGuard fails.
# ausearch -m AVC -ts recent

# Arch Linux: no extra command; the shared module setup above is enough.

# Ubuntu rollback after the AppArmor package is fixed:
# aa-enforce /etc/apparmor.d/wg-quick
```

If the AppArmor profile is at a different path, use that path with
`aa-complain` and `aa-enforce`. If the search returns nothing, the Ubuntu
workaround is not needed.

### 2. Deploy or redeploy

Deploy the app from LitePod after completing the applicable host steps above.

### 3. Verify the interface

In the LitePod terminal for this service, run:

```sh
wg show wg0
```

It should show the server public key and listening port. If it instead says
`Unable to access interface`, review the service logs and repeat the relevant
host step above before redeploying.
