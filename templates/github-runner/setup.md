# Before deploying

Create a GitHub personal access token and paste it into `ACCESS_TOKEN`. A classic token needs the `repo` scope for a repository runner, or `admin:org` for an organization runner. The container exchanges it for a short-lived registration token on every start, so the runner keeps working after restarts.

Set `RUNNER_SCOPE=repo` with `REPO_URL`, or `RUNNER_SCOPE=org` with `ORG_NAME`. Then target the runner from a workflow with its labels:

```yaml
runs-on: [self-hosted, litepod]
```

The runner only opens outbound connections to GitHub, so this template publishes no ports.

**Docker is not available inside the runner.** Jobs that use `container:`, `services:` or `docker build` will fail. Mounting the host's Podman socket would fix that, but it gives every workflow full control of the host and every container on it — only do it for private repositories you trust.

Never attach a self-hosted runner to a public repository: a pull request from a fork can run arbitrary code on your server. Treat `ACCESS_TOKEN` as a credential and do not commit a real one.
