# First boot

`seafile` initialises the database, generates config and creates the admin
account (from `INIT_SEAFILE_ADMIN_EMAIL` / `INIT_SEAFILE_ADMIN_PASSWORD`) on
first start — it can take a couple of minutes. Follow it with
`podman compose logs -f seafile`, then log in with the admin email once it
reports the server has started.

# URL is persisted

Seafile writes `SERVICE_URL` and `FILE_SERVER_ROOT` (from
`SEAFILE_SERVER_HOSTNAME` + `SEAFILE_SERVER_PROTOCOL`) into `seahub_settings.py`
and the database on first init. Changing `.env` afterwards does not move an
existing install — update those values in `/shared/seafile/conf/` inside the
container, or re-deploy fresh.

LitePod terminates TLS in front of the app: keep `SEAFILE_SERVER_PROTOCOL=http`
for generated domains, and set it to `https` once you attach a domain with a
certificate.

# Backups

File blocks live in the `seafile_data` volume (`/shared`), metadata in
`seafile_db_data` (MariaDB), cache in `seafile_redis_data`. Back up the data and
database volumes together; the cache volume can be discarded. See the Seafile
manual's backup/restore guide for a consistent procedure.
