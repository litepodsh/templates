# AdGuard Home

Create a Litepod domain for the `adguardhome` service on port `3000`, then open
it to finish the setup wizard. Keep the web interface on port 3000 so Litepod
can route it; the DNS, DHCP, DNS-over-TLS, and DNS-over-QUIC ports are published
directly on the host.

## Network requirements

This template reserves these host ports: DNS `53/tcp` and `53/udp`, DHCP
`67/udp` and `68/udp`, DNS-over-TLS `853/tcp`, and DNS-over-QUIC `853/udp`.
They must be free on the selected server. DHCP also needs the host network to
reach the LAN clients it serves.
