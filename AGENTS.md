# Agent notes

Catalog conventions — drop-in reference for the `templates/` directory. See
`README.md` for the full schema; this file only covers rules you can't recover
by reading the existing templates.

## Compose

- Never write a top-level `version:` key. It's deprecated by the Compose spec
  and ignored by modern Podman/Docker.
- Always use **named volumes**, never bind mounts. Named volumes work
  rootless, survive `podman compose down`, and are portable across hosts.
  A `templates/<id>/.env` is for tunables, not for paths the user has to
  create on disk.
- Fully qualify every image (`docker.io/...`, `ghcr.io/...`). Podman has no
  implicit registry fallback.
- Every tunable goes in `.env` and is referenced as `${VAR}` in the compose
  file. Hard-coded values belong in `.env` defaults, not in `compose.yml`.

## Template folder layout

```
templates/<id>/
├── template.toml    # manifest
├── compose.yml      # compose
├── .env             # tracked; catalog content, not secrets
└── logo.svg         # optional; or remote `icon = "https://..."` in manifest
```

Folder name must equal `template.toml`'s `[template].id` and match
`^[a-z0-9][a-z0-9._-]*$` (enforced in `src/lib/server/catalog.ts`).

## Verify before commit

```sh
podman compose -f templates/<id>/compose.yml --env-file templates/<id>/.env up -d
podman compose -f templates/<id>/compose.yml down -v
```

Templates are catalog content — never populate `.env` with real secrets.
Defaults are placeholders users override at deploy time.
