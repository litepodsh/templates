# Home Assistant

Open `http://<host>:8123` and complete the onboarding wizard to create the first
account. All configuration lives in the `homeassistant_config` volume
(`/config`), editable from the built-in **Settings → Add-ons / File editor** or
directly in the volume.

## Networking

This template uses **bridge networking**, so Home Assistant is reachable on port
8123 but cannot see broadcast/multicast traffic on your LAN. Integrations that
rely on auto-discovery — Matter, HomeKit, Google Cast, Sonos, most Wi-Fi
devices — must be added manually by IP address.

For full local discovery, change the `homeassistant` service in `compose.yml` to:

```yaml
    network_mode: host
```

and remove the `expose:` / `ports:` lines. Host networking gives the container
direct access to the host's network stack (this is what the Home Assistant docs
recommend) at the cost of container network isolation.

## USB / Zigbee / Z-Wave dongles

Passing through a serial dongle needs a device mapping, which is host-specific:

```yaml
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0
```
