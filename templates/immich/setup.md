# Photo/video library location

Upstream stores the library on a host path (`UPLOAD_LOCATION`). This template
keeps it in the `immich_upload` named volume so it runs rootless with no host
setup. That volume holds **all originals** — size the underlying storage
accordingly and include it in your backups.

To put the library on a specific disk/host path instead, edit `compose.yml`:

```yaml
  immich-server:
    volumes:
      - /srv/immich/library:/data      # was: immich_upload:/data
```

and drop `immich_upload` from the bottom `volumes:` list.

# Database image

`db` uses `ghcr.io/immich-app/postgres:14-vectorchord…`, which bundles the
vector-search extensions Immich needs. It is pinned on purpose — do not replace
it with stock `postgres`, and do not point a newer image at an existing
`immich_db_data` volume. Keep `IMMICH_DB_PASSWORD` limited to `A-Za-z0-9`.

# Version

`compose.yml` tracks the `release` tag (latest stable). To pin a version, change
`:release` to `:vX.Y.Z` on both `immich-server` and `immich-machine-learning`
and follow the release notes when upgrading.

# First use

The database runs a one-time init and the server migrates its schema on first
start; give it a few minutes. Then open `:2283`, create the admin account, and
point the mobile app at the same URL.
