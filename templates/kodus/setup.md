Kodus reviews pull requests with an LLM. You connect your Git provider from the web app after deploying. Nothing provider-specific goes in the environment, so the same deploy works for GitHub, GitLab, Bitbucket, Azure DevOps or Forgejo.

## Before you connect a provider

Kodus has two public addresses: the **web app** (primary port) and the **webhooks** receiver (port 3332). When you connect a provider, Kodus registers a webhook on each repository using the webhooks address it has at that moment. Changing that domain later doesn't update webhooks that already exist.

1. If you want custom domains, add them to both routes first and redeploy. Use HTTPS: providers send code-review events with repository content to this address.
2. Set an LLM. Either put an OpenAI key in `OPENAI_API_KEY` (or point `OPENAI_BASE_URL` at any OpenAI-compatible endpoint), or leave it empty and add your own provider in the web app.

The first boot runs database migrations and can take a few minutes before the web app answers.

## Connect GitHub or Azure DevOps

1. Open the web app and create your account. The first account owns the organization.
2. Pick your provider and paste a personal access token:
   - [GitHub token](https://docs.kodus.io/how_to_use/en/code_review/general_config/github_pat)
   - [Azure DevOps token](https://docs.kodus.io/how_to_use/en/code_review/general_config/azure_devops_pat)
   - [GitLab token](https://docs.kodus.io/how_to_use/en/code_review/general_config/gitlab_pat) and [Bitbucket token](https://docs.kodus.io/how_to_use/en/code_review/general_config/bitbucket_pat) work the same way.
3. Choose the repositories to review. Kodus creates their webhooks for you.

You can connect another provider later from the same screen. If you change the webhooks domain after connecting, reconnect the provider so Kodus registers the new address.

## Email

Invites and reports need email. Set `KODUS_EMAIL_PROVIDER=smtp` with the `SMTP_*` values, or `resend` with `RESEND_API_KEY`. Without either, add teammates by sharing the sign-up link.

## Not included

This template runs the community stack: web app, API, review worker, webhooks receiver, Postgres, MongoDB and RabbitMQ. It leaves out the MCP plugin manager and the Enterprise analytics worker. Each review is billed by your LLM provider.
