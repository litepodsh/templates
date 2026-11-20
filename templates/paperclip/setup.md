Paperclip coordinates teams of AI agents: you define a company, an org chart and goals, and agents (Claude Code, Codex, OpenCode, Gemini CLI and others) pick up work within budgets and approval gates.

## Before you deploy

Set at least one provider key, `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. The agent CLIs are already in the image, but without a key agents can't run.

`BETTER_AUTH_SECRET` and `PAPERCLIP_TOOL_ACTION_SIGNING_SECRET` are generated for you. Don't replace them after the first deploy: that signs everyone out and invalidates approvals that are still pending.

## First sign-in

The instance runs in authenticated mode with public exposure. In that mode the browser "Claim this instance" shortcut is disabled, so the first admin comes from a one-time invite created with the CLI inside the container:

```sh
pnpm paperclipai auth bootstrap-ceo
```

Open the invite URL it prints, create your account, then follow the onboarding to create your first company. Upstream documents this command for public deployments; if it can't find its config, point it at the instance with `--config` (the server's config is under `/paperclip/instances/default/`). This step was not exercised end to end when the template was written: the server itself starts and answers `/api/health`.

## Notes

- **Data.** The database lives in the `paperclip_pgdata` volume. Uploads, the local secrets key and agent workspaces live in `paperclip_data`. Back both up.
- **Extra hostnames.** If you reach the instance by another name (a Tailscale alias, a second domain), list it in `PAPERCLIP_ALLOWED_HOSTNAMES`.
- **Agents run inside the container.** The `*_local` adapters execute CLI agents in this container with access to its volume. Treat what you let them do accordingly.
