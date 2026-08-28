# code-server

Browser-based VS Code. Open port 8080 and log in with `CODE_SERVER_PASSWORD`.
Home directory, settings, extensions and any repos you clone live in the
`code_server_data` volume (`/home/coder`).

- The `init-perms` one-shot container `chown`s the volume to uid 1000 before
  code-server starts — needed because the image runs as the non-root `coder`
  user and a fresh named volume is root-owned. It exits immediately on every
  `up`; that is expected.
- `CODE_SERVER_PASSWORD` is the single login credential — there are no user
  accounts. Put it behind a reverse proxy with TLS before exposing it publicly.
- `CODE_SERVER_SUDO_PASSWORD` enables `sudo` in the integrated terminal for
  installing system packages inside the container.
- To open a specific folder on start, add `DEFAULT_WORKSPACE=/home/coder/project`
  to `.env` and the compose `environment:` block.
