MonoCode Host runs your coding agents on this server. You drive its sessions from the MonoCode desktop app; this app has no web interface, and opening the domain in a browser returns an error.

MonoCode publishes no container image, so the host is downloaded from the GitHub release when the app first starts. It is kept in the `monocode_app` volume and only downloaded again when `MONOCODE_VERSION` changes. Keep that version equal to your desktop app's version.

## Install an agent

The host doesn't include any coding agent. Open a terminal in this app and install the ones you use, then sign in to them. They go in `/root`, with their credentials, and stay in the `monocode_home` volume. For example:

- Claude Code: `curl -fsSL https://claude.ai/install.sh | bash`, then `claude` to sign in.
- Codex: `npm install -g @openai/codex`, then `codex login --device-auth`.

**Restart the app after installing or removing an agent.** The host only looks for agents when it starts; its logs list the ones it found.

## Clone your projects

Repositories also live in the home volume. From the same terminal, for example: `git clone https://github.com/you/app.git /root/code/app`.

## Pair the desktop app

1. In the terminal, run `monocode-host pair --name "My laptop"` and copy the `token` it prints. It is only shown once.
2. In the desktop app, open **Settings → Connections → Connect to an existing host by URL**, enter this app's URL (`https://…`, no path) and the token.
3. Open a project with **+ → Open folder on a machine…** and type a path such as `/root/code/app`.

Pair each desktop separately. `monocode-host devices` lists them and `monocode-host revoke <device-id>` removes one.

## Security

**A device token gives full control of this container**: it runs agents and reads and writes every file in it, including your repositories and agent credentials. Agents run as root inside the container, which is why Claude Code's bypass mode is allowed here.

Updating the host interrupts running agent turns; transcripts are kept.
