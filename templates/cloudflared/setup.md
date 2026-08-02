# Before deploying

Create a **remotely managed** tunnel in the Cloudflare Zero Trust dashboard. Configure the tunnel's public hostnames and origin services there, then copy the tunnel token into `CLOUDFLARED_TUNNEL_TOKEN`.

`cloudflared` creates outbound-only connections, so this template publishes no host ports. Any origins in the tunnel configuration must be reachable from the container network; services deployed in the same Compose project can be addressed by service name (for example, `http://app:3000`).

Treat the tunnel token as a credential. The tracked `.env` only contains a placeholder—replace it in your deployment environment and do not commit a real token.
