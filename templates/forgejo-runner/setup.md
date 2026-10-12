# Before deploying

In Forgejo, open **Settings → Actions → Runners → Create new runner** (site admin, organization, user or repository — that decides which repositories can use it). Copy the **UUID** and **Token** it shows into `RUNNER_UUID` and `RUNNER_TOKEN`, and set `FORGEJO_URL` to your instance's address.

Target the runner from a workflow with one of the names in `RUNNER_LABELS`:

```yaml
runs-on: docker
```

The runner only opens outbound connections to Forgejo, so this template publishes no ports.

## Set resource limits

**Adjust `JOBS_CPU_LIMIT` and `JOBS_MEMORY_LIMIT` before you deploy.** Every job — and every container a job starts with `services:` or `docker run` — runs inside the `docker-in-docker` container, so these two values cap all CI work combined. Without a sensible cap, one heavy build can starve every other app on the server.

- Leave at least 1 CPU and 1–2 GB of RAM free for the rest of the host.
- `RUNNER_CAPACITY` jobs share the same limit; raise the limits along with it.
- The defaults (2 CPUs, 4 GB) suit typical Node/Go/Python builds with one job at a time.

Built images and pulled layers accumulate in the `dind_data` volume. Prune it now and then from the app's terminal: `docker system prune -af`.

## Security

Jobs get their own Docker daemon, not your host's Podman, so a workflow cannot touch your other apps' containers or volumes. The `docker-in-docker` container still runs `privileged` (Docker needs it), so only connect the runner to repositories you trust — never let pull requests from forks of a public repository run on it. Treat `RUNNER_TOKEN` as a credential.
