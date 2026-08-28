# qBittorrent

Web UI on port 8080, downloads land in the `qbittorrent_downloads` volume
(`/downloads`), settings in `qbittorrent_config` (`/config`).

## First login

Recent LinuxServer images generate a **random temporary password on first start**
and print it to the container log:

```sh
podman logs qbittorrent 2>&1 | grep -i password
```

Log in as `admin` with that password, then set a permanent one in
**Tools → Options → Web UI**.

## Peer port

`QBITTORRENT_TORRENTING_PORT` (default 6881) is published on the host for TCP and
UDP. Forward the same port on your router and set it as the listening port under
**Options → Connection** so inbound peer connections work. Leaving it closed
still allows downloads but hurts swarm connectivity.

## Image

No official qBittorrent container exists; this uses
[`lscr.io/linuxserver/qbittorrent`](https://docs.linuxserver.io/images/docker-qbittorrent/),
the de-facto standard build. `PUID`/`PGID` must match the owner of the volume
data.
