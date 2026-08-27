# Before deploying

## Admin credentials

`GEOSERVER_ADMIN_USER` / `GEOSERVER_ADMIN_PASSWORD` seed the primary admin
account **only on the first boot** (when `geoserver_data` is empty). The stock
`admin` / `geoserver` login is a common attack target — set a real password
before exposing the instance. Change it later from *Security → Users* in the UI.

## `PROXY_BASE_URL`

Set `GEOSERVER_PROXY_BASE_URL` to the exact external URL of the `/geoserver`
context (`https://gis.example.com/geoserver`). GeoServer writes this host into
every capabilities document and layer preview link, so map clients break if it
is wrong.

## Extensions

Set `GEOSERVER_INSTALL_EXTENSIONS=true` and list plugins in
`GEOSERVER_STABLE_EXTENSIONS` (space-separated, e.g. `wps css importer`) to have
them downloaded at container start.

The data directory (workspaces, stores, styles, security config) lives in the
`geoserver_data` volume; the UI is served at `/geoserver/web`.
