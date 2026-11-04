PR-Agent has no web UI. It waits for webhooks from your forge, then comments on pull requests. Opening its URL only returns a status message.

Before you deploy, set `PR_AGENT_PROVIDER` and an LLM key for `PR_AGENT_MODEL`. Then finish the steps for your forge, using the generated `PR_AGENT_WEBHOOK_SECRET` as the webhook secret.

## GitHub

1. [Create a GitHub App](https://github.com/settings/apps/new) with the webhook URL `https://<your-domain>/api/v1/github_webhooks`.
2. Grant these repository permissions: **Pull requests** read and write, **Issues** read and write, **Contents** read-only, **Metadata** read-only.
3. Subscribe to these events: **Issue comment**, **Pull request**, **Pull request review**, and **Pull request review comment**.
4. Generate a private key, then set `GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY_BASE64`. LitePod values must fit on one line, so encode the key with `base64 -w0 key.pem` (on macOS, `base64 -i key.pem`).
5. Install the app on your repositories.

## GitLab

1. Create a user with the **Developer** role on the project or group, and give it a personal access token with the `api` scope.
2. Set `GITLAB_TOKEN`. For a self-hosted instance, also set `GITLAB_URL`.
3. Add a project webhook to `https://<your-domain>/webhook`, with the secret as its token and these triggers: **Push**, **Comments** and **Merge request events**.

## Gitea or Forgejo

1. Create a user with access to the repository, and give it an access token.
2. Set `GITEA_TOKEN` and `GITEA_URL`.
3. Add a repository webhook to `https://<your-domain>/api/v1/gitea_webhooks`, with the secret and these events: **Push**, **Pull request** and **Issue comment**.

## Usage and cost

Each new pull request runs `/describe`, `/review` and `/improve` automatically, and each run bills your LLM provider. People who can comment on a pull request can also trigger commands such as `/ask`, so keep this off repositories where you don't trust the commenters.

To change PR-Agent's behaviour for one repository, add a [`.pr_agent.toml`](https://docs.pr-agent.ai/usage-guide/configuration_options/) to its default branch.
