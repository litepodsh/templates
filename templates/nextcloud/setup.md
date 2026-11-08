# First boot

`nextcloud` creates the admin account (from `NEXTCLOUD_ADMIN_USER` /
`NEXTCLOUD_ADMIN_PASSWORD`) and runs the initial install and migrations on first
start — give it a minute or two. Then open the web UI and log in with those
credentials; change the password from **Personal settings → Security**.

# URL is persisted

Nextcloud writes the trusted domain and `overwrite.cli.url` into `config.php`
(inside the `nextcloud_html` volume) on first boot. If you later move the app to
a new domain, add the host to `NEXTCLOUD_TRUSTED_DOMAINS` **before** the switch,
then update it in-app or via `occ`:

```sh
podman compose exec --user www-data nextcloud php occ config:system:set trusted_domains 1 --value=your.domain.example
podman compose exec --user www-data nextcloud php occ config:system:set overwrite.cli.url --value=https://your.domain.example
```

# HTTPS / reverse proxy

LitePod terminates TLS in front of the app. Nextcloud runs plain HTTP on port
80 internally; the `OVERWRITECLIURL` ({{url}}) keeps generated links correct. If
you put your own domain with a certificate on the route, redeploy so the marker
resolves to the new https URL.

# Background jobs

The `cron` service runs `cron.php` every 5 minutes. In
**Administration → Basic settings → Background jobs**, choose **Cron** for
reliable scheduled tasks.

# Backups

Back up `nextcloud_html` (config + apps + user data) and `nextcloud_db_data`
together — they must stay consistent. Prefer a maintenance-mode dump:

```sh
podman compose exec --user www-data nextcloud php occ maintenance:mode --on
```

…then snapshot the volumes and `--off` to resume.
