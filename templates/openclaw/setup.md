# Before deploying

Set at least one AI provider key such as `ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY` — the container exits without one. With several keys set, the primary model is picked by provider priority; pin one with `OPENCLAW_PRIMARY_MODEL` (e.g. `anthropic/claude-sonnet-4-5-20250929`).

If you serve OpenClaw on a domain, add it to `OPENCLAW_ALLOWED_ORIGINS` (e.g. `https://claw.example.com`), or the Control UI will be rejected by CORS.

# After deploying

- **Control UI:** `http://<host>:8080`, login with `AUTH_USERNAME` / `AUTH_PASSWORD`.
- **Browser desktop:** `http://<host>:8080/browser/` — log into sites that need OAuth, 2FA or captchas; the agent reuses those sessions.

Channels are enabled by setting their tokens (`TELEGRAM_BOT_TOKEN`, `DISCORD_BOT_TOKEN`, …). For WhatsApp, set `WHATSAPP_ENABLED=true` and pair the device from the Control UI.

Keep `OPENCLAW_GATEWAY_BIND=loopback`: `lan` exposes the gateway directly and bypasses basic auth. The agent can run shell commands and browse the web, so don't run it without `AUTH_PASSWORD`.
