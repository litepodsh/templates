# Before deploying

Set `WG_EASY_INIT_HOST` to the public DNS name or IP address clients use to reach this server, and replace `WG_EASY_INIT_PASSWORD` with a long unique password. These initial settings are consumed only on the first start.

Assign a LitePod domain to the web UI. WireGuard itself still needs UDP `${WG_EASY_WIREGUARD_PORT}` open on the host for VPN clients.

## If startup fails with an iptables NAT error

This template works with rootful or rootless Podman. In rootless mode, kernel
modules must be loaded on the host; the container cannot load them. If the
service logs include `Module ip_tables not found` or `can't initialize
iptables table 'nat'`, run the following with a host account that has `sudo`,
then redeploy the service:

```sh
# Load the WireGuard and legacy IPv4 firewall modules now and at boot.
sudo modprobe wireguard ip_tables iptable_filter iptable_nat xt_MASQUERADE
printf '%s\n' wireguard ip_tables iptable_filter iptable_nat xt_MASQUERADE \
  | sudo tee /etc/modules-load.d/wg-easy.conf

# Fedora: allow WireGuard clients to reach the server over UDP.
sudo firewall-cmd --permanent --add-port=51820/udp
sudo firewall-cmd --reload

# Ubuntu 26.04 only, and only if logs show "readlink: Permission denied"
# or AppArmor denies wg-quick access to /bin/busybox.
# apt install -y apparmor-utils
# find /etc/apparmor.d -type f -name '*wg-quick*' -print
# If the previous command returns /etc/apparmor.d/wg-quick, run:
# aa-complain /etc/apparmor.d/wg-quick

# Fedora only: do not use aa-complain. Inspect SELinux denials if WireGuard fails.
# ausearch -m AVC -ts recent

# Ubuntu rollback after the AppArmor package is fixed:
# aa-enforce /etc/apparmor.d/wg-quick
```

If the AppArmor profile is at a different path, use that path with
`aa-complain` and `aa-enforce`. If the search returns nothing, the Ubuntu
workaround is not needed.

### 2. Deploy or redeploy

Deploy or redeploy the app from LitePod after completing the applicable host steps above.

### 3. Verify the interface

In the LitePod terminal for this service, run:

```sh
wg show wg0
```

It should show the server public key and listening port. If it instead says
`Unable to access interface`, review the service logs and repeat the relevant
host step above before redeploying.
