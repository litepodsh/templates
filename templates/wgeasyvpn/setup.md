# Before deploying

Set `WG_EASY_INIT_HOST` to the public DNS name or IP address clients use to reach this server, and replace `WG_EASY_INIT_PASSWORD` with a long unique password. These initial settings are consumed only on the first start.

Assign a LitePod domain to the web UI. WireGuard itself still needs UDP `${WG_EASY_WIREGUARD_PORT}` open on the host for VPN clients.

## Rootless Podman host setup

If this service runs with rootless Podman, configure the following on the
server as `root` before deploying:

### 1. Load the host kernel modules

Load the modules used by WireGuard and wg-easy's IPv4 firewall hooks, then
make them persistent:

```sh
modprobe wireguard nft_masq ip_tables iptable_filter iptable_nat xt_MASQUERADE
printf '%s\n' wireguard nft_masq ip_tables iptable_filter iptable_nat xt_MASQUERADE \
  > /etc/modules-load.d/wg-easy.conf
```

### 2. Apply the distribution-specific host setup

<Tabs items={['Ubuntu', 'Fedora', 'Arch Linux']} defaultIndex={0}>
  <Tab value="Ubuntu">

If the logs show `/usr/bin/readlink: Permission denied` and AppArmor denies
`wg-quick` access to `/bin/busybox`, its host AppArmor profile is blocking the
rootless container. Run:

```sh
apt install -y apparmor-utils
find /etc/apparmor.d -type f -name '*wg-quick*' -print
```

If the command returns `/etc/apparmor.d/wg-quick`, apply the workaround:

```sh
aa-complain /etc/apparmor.d/wg-quick
```

If it returns a different path, use that path with `aa-complain`. If it returns
nothing, this AppArmor profile is not installed and the workaround is not
needed.

This only changes the `wg-quick` profile to complain mode. Re-enable
enforcement after the AppArmor package is fixed:

```sh
aa-enforce /etc/apparmor.d/wg-quick
```

  </Tab>
  <Tab value="Fedora">

The Ubuntu AppArmor workaround does not apply. If WireGuard fails, inspect
SELinux AVC denials on the host before changing policy:

```sh
ausearch -m AVC -ts recent
```

  </Tab>
  <Tab value="Arch Linux">

The Ubuntu AppArmor workaround does not apply. Ensure the host kernel modules
from step 1 are loaded, then redeploy the service.

  </Tab>
</Tabs>

### 3. Deploy or redeploy

Deploy the app from LitePod after completing the applicable host steps above.

### 4. Verify the interface

In the LitePod terminal for this service, run:

```sh
wg show wg0
```

It should show the server public key and listening port. If it instead says
`Unable to access interface`, review the service logs and repeat the relevant
host step above before redeploying.
