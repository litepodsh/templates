Sign in as `admin` with the generated `HARNESS_ADMIN_PASSWORD`, then change it. The admin is only created on first boot, so editing these values later doesn't change an existing account. Public sign-up is off; create other users from the admin screen, or set `HARNESS_USER_SIGNUP_ENABLED=true`.

For Git over HTTP, use an access token from your profile as the password, not your account password. Git over SSH uses `HARNESS_SSH_PORT`; open that port in your server's firewall.

Pipelines use Harness's own YAML format, so GitHub Actions workflows need rewriting. Create one from a repository's **Pipelines** tab, for example:

```yaml
kind: pipeline
spec:
  stages:
  - type: ci
    spec:
      steps:
      - name: test
        type: run
        spec:
          container: docker.io/library/alpine:3.20
          script: echo hello
```

## Set resource limits

**Adjust `JOBS_CPU_LIMIT` and `JOBS_MEMORY_LIMIT` before you deploy.** Every pipeline step runs inside the `docker-in-docker` container, so these two values cap all CI work combined. Leave at least 1 CPU and 1–2 GB of RAM free for the rest of the host.

Pulled images accumulate in the `dind_data` volume. Prune them now and then from the `docker-in-docker` terminal: `docker system prune -af`.

## Security

Pipelines get their own Docker daemon, not your host's Podman, so a pipeline cannot touch your other apps' containers or volumes. The `docker-in-docker` container still runs `privileged`, so only run pipelines from people you trust.

Pipeline secrets are stored unencrypted in the `harness_data` volume, so protect its backups. Don't set `GITNESS_ENCRYPTER_SECRET`: in Harness 3.3.0, pipelines receive secrets encrypted with that key instead of their real value.

## Gitspaces

Gitspaces are disabled because their IDE ports stay inside `docker-in-docker`, where a browser can't reach them.
