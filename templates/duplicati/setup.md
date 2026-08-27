# Backing up other stacks

This template only mounts its own config volume (`duplicati_config` → `/data`).
To back something up, attach the source as an extra volume on the `duplicati`
service and point a backup job at it. For another stack's named volume:

```yaml
    volumes:
      - duplicati_config:/data
      - immich_upload:/source/immich:ro
```

Then in the UI create a backup job with source path `/source/immich` and a
destination (local folder under `/data`, an SMB/NFS share, S3, B2, …).

# Secrets

- `DUPLICATI_WEBSERVICE_PASSWORD` — web UI login.
- `DUPLICATI_SETTINGS_ENCRYPTION_KEY` — encrypts Duplicati's own job database in
  `duplicati_config`. Record it somewhere safe; losing it means you cannot
  restore the Duplicati configuration itself (individual backups still restore
  with their own passphrase).
