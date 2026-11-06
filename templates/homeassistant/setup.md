# Home Assistant

Open the app's HTTPS domain, or `http://<host-ip>:8123` on the local network,
and complete the onboarding wizard to create the first account. All
configuration lives in the `homeassistant_config` volume (`/config`).

## Network mode

This template runs Home Assistant with `network_mode: host` — the container
shares the host's network stack instead of a bridged one. That is what the Home
Assistant documentation recommends, and the only way auto-discovery works:
mDNS, SSDP and Matter/HomeKit traffic are broadcast/multicast and never cross
the container bridge.

Consequences worth knowing:

- **Discovery works** for Matter, HomeKit, Google Cast, Sonos and most Wi-Fi
  devices as soon as they are on the same LAN.
- **Port 8123 is taken on the host.** A second Home Assistant on the same
  server needs a different port (edit `http: server_port` in
  `configuration.yaml` and the `[[ports]]` entry). Litepod's server ports view
  lists it as a host-network port so the conflict is visible before deploying.
- The web UI is reachable over plain HTTP on the LAN in addition to the HTTPS
  domain. Put the host behind a firewall you trust.
- **Remote servers:** the HTTPS domain is routed through the local Litepod
  Caddy only. On a remote SSH server, use the host IP and port instead.
- This requires a Litepod version that supports the `host-network` catalog
  feature; older installs do not show this template.

## USB / Zigbee / Z-Wave dongles

Still unsupported by Litepod: passing a serial device through needs a
host-specific `devices:` mapping and the rootless Podman user to have access to
the node:

```yaml
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0
```

Alternatively run Zigbee2MQTT or Z-Wave JS on a small device next to the
coordinator and point Home Assistant at it over the network.
