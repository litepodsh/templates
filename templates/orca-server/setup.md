Orca Server runs coding agents in isolated git worktrees on this machine. You drive it from the Orca desktop app, a browser or the mobile app.

Orca publishes no container image, so the app installs itself when it starts. The first start takes about three minutes, and the domain returns an error until it finishes. Each redeploy reinstalls the system packages, so it takes about as long, but Orca is only downloaded again when `ORCA_VERSION` changes.

## Pair a client

1. Open the app's logs and find `Orca server ready`.
2. Copy the `Web client URL` line to open Orca in a browser, already paired. For the desktop app, copy the `Pairing URL: orca://pair?code=...` line and paste it in **Settings > Remote Orca Servers**.

**The pairing link is a credential.** Anyone who has it can run commands on this server, so share it only with the client you are pairing, and limit who can read this app's logs. Paired devices stay paired after a redeploy.

## Pair the mobile app

The mobile app needs its own link. Set `ORCA_SERVE_ARGS=--mobile-pairing` and redeploy, scan the QR code from the logs, then clear the variable and redeploy. On a phone, the `Web client URL` also works in the browser without this step.

## Coding agents

Orca doesn't include any coding agent. Install the ones you use from an Orca terminal on this server. They go in `/home/orca/.local/bin` and stay in the `orca_home` volume with their credentials and your repositories.

For example, for Claude Code: `curl -fsSL https://claude.ai/install.sh | bash`.

## Security

Orca seals its credentials with a key kept next to them in the `orca_home` volume, so treat that volume as sensitive. Agents have full shell access inside this container, including whatever repositories and credentials you add to it.

D-Bus and keyring errors in the logs at startup are expected and harmless.
