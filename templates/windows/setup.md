# Before deploying

This template runs a full Windows virtual machine (QEMU) inside a container. It needs **hardware
virtualization (KVM) on the server** the app is deployed to. Without it Windows does not start, and
the container log shows:

```
ERROR: KVM acceleration is not available (/dev/kvm is missing / is unwriteable)
```

LitePod cannot fix this from the UI: it is a one-time change on the server itself.

## Where to run these commands

- **On the server that runs the app**, not inside the container. If the app goes to a remote
  server, SSH into that server, not into the LitePod host.
- **As `root`** (`ssh root@your-server`, or `sudo -i` from a sudo user). The commands change device
  permissions, and the rootless user LitePod deploys with (for example `norootuser`) cannot do that.
  Do **not** `su` into that user to run them.
- **Only once per server.** The change survives reboots. Then deploy or redeploy the app normally.

## 1. Check that the server has KVM

```sh
ls -l /dev/kvm                          # must exist
grep -cE 'vmx|svm' /proc/cpuinfo        # must be greater than 0
```

If `/dev/kvm` does not exist, the server does not expose virtualization. On a VPS, ask the provider
for **nested virtualization**, or use a dedicated server. There is no workaround inside LitePod.

## 2. Let the rootless Podman user open /dev/kvm

LitePod deploys apps with **rootless Podman**. On most Debian/Ubuntu servers `/dev/kvm` is
`root:kvm 0660`, so the rootless user is refused even though the device exists ("is unwriteable").
Open it to local users with a udev rule (the default on many distributions):

```sh
echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666"' > /etc/udev/rules.d/99-kvm.rules
udevadm control --reload-rules && udevadm trigger --name-match=kvm
ls -l /dev/kvm                          # now: crw-rw-rw- 1 root kvm ... /dev/kvm
```

If the server runs Podman as root instead (rootful), `/dev/kvm` is already accessible and you can
skip this step.

## 3. Size it

Each instance reserves `RAM_SIZE` (4G by default) and `CPU_CORES` (2) on the server, and uses up to
`DISK_SIZE` (64G) in the `windows_storage` volume. Check `free -g` and `df -h` before deploying.

**The server needs `RAM_SIZE` + 1 GB of RAM that is actually free**, not swap. The guest's memory is
in constant use, so a server that has to swap it out stalls: every other app slows down and even SSH
stops answering until the VM is stopped. `CONTAINER_MEMORY_LIMIT` (5g by default) caps the container
so that, if memory runs out, only Windows is killed. Raise it together with `RAM_SIZE`.

`RDP_PORT` (3389) is opened on the server's public IP. Change it if another app already uses it.

# After deploying

The first boot downloads the Windows ISO from Microsoft (4–8 GB) and installs it unattended; this
takes 10–30 minutes. Follow it on the app's domain (web viewer, port 8006).

When the desktop appears, connect with Remote Desktop to `<server-ip>:<RDP_PORT>` using
`WINDOWS_USERNAME` and `WINDOWS_PASSWORD` (shown in the app's environment). RDP is faster than the
web viewer and supports the clipboard.

`WINDOWS_USERNAME`, `WINDOWS_PASSWORD`, `WINDOWS_VERSION` and the language settings are only used
during the first install. Changing them later does nothing unless you delete the `windows_storage`
volume, which **erases the machine**.

**Licensing:** Windows is installed without a product key. Activating it with a valid license is the
user's responsibility.

**Security:** the web viewer has no login of its own; anyone with the URL sees the console. Put the
app behind access protection, or remove its domain once Windows is installed and you use RDP.
