# Host prerequisite: `vm.max_map_count`

SonarQube runs an embedded Elasticsearch and will not start unless the host
kernel allows enough memory-map areas:

```sh
sudo sysctl -w vm.max_map_count=262144
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-sonarqube.conf
```

`fs.file-max` should be at least `131072`; the container's `nofile` / `nproc`
ulimits are already raised in `compose.yml`.

# First login

Default credentials are `admin` / `admin`; SonarQube forces a password change on
first sign-in. Do that before exposing the instance.

# Edition & upgrades

`compose.yml` tracks the rolling `community` tag (SonarQube Community Build).
Read the upgrade notes before moving across major versions — SonarQube runs a
one-time database migration on start and does not support skipping majors.

# Data

- `sonarqube_data` — the analysis database index and Compute Engine data
- `sonarqube_extensions` — installed plugins
- `sonarqube_logs` — server logs
- `sonarqube_postgres_data` — PostgreSQL

Analysis results and settings live in PostgreSQL; back up the `db` volume.
