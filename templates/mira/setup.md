Mira reviews pull requests with an LLM and keeps its history in a web dashboard. Open the app's URL and sign in as `admin` with `MIRA_ADMIN_PASSWORD`.

**Before you deploy, set `MIRA_LLM_API_KEY` and configure at least one forge below.** Without a forge, Mira exits with `No platform configured` and the app restarts until you add one. You can configure several forges in the same app. If you do, also set `MIRA_BOT_NAME` so the `@mention` handle is the one you expect.

Mira doesn't create webhooks on GitLab or Forgejo for you. Each one below needs the matching generated `*_WEBHOOK_SECRET`.

## GitHub

1. [Create a GitHub App](https://github.com/settings/apps/new) with the webhook URL `https://<your-domain>/github/webhook` and the secret from `MIRA_GITHUB_WEBHOOK_SECRET`.
2. Grant these repository permissions: **Pull requests** read and write, **Contents** read and write, **Issues** read and write, **Metadata** read-only. Mira needs write access to Contents to resolve review threads.
3. Subscribe to these events: **Pull request**, **Issue comment**, **Push** and **Installation**.
4. Generate a private key, then set `MIRA_GITHUB_APP_ID` and `MIRA_GITHUB_PRIVATE_KEY_BASE64`. LitePod values must fit on one line, so encode the key with `base64 -w0 key.pem` (on macOS, `base64 -i key.pem`).
5. Install the app on your repositories.

## GitLab

1. Create a group or project access token with the **Developer** role and the `api` scope, and set it as `MIRA_GITLAB_TOKEN`. For a self-managed instance, also set `MIRA_GITLAB_API_URL`.
2. Add a webhook to `https://<your-domain>/gitlab/webhook`, with `MIRA_GITLAB_WEBHOOK_SECRET` as its secret token and these triggers: **Merge request events**, **Comments** and **Push events**.

## Forgejo or Gitea

1. Use a dedicated bot account if you can. Generate an access token with `repository` read and write and `user` read, and set it as `MIRA_FORGEJO_TOKEN`.
2. For your own instance, set `MIRA_FORGEJO_API_URL`, for example `https://git.example.com/api/v1`. Left empty, Mira uses Codeberg.
3. Add a Forgejo webhook on the repository or organization, pointing to `https://<your-domain>/forgejo/webhook`, with `MIRA_FORGEJO_WEBHOOK_SECRET` as its secret and these events: **Pull request**, **Issue comment** and **Push**.

## Usage and cost

Each pull request bills your LLM provider, and indexing a repository uses it too. People who can comment on a pull request can also trigger Mira with an `@mention`, so keep it off repositories where you don't trust the commenters.

To change the review rules for one repository, add a `.mira.yaml` to it.
