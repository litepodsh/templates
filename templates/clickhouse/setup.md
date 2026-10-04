# After deploying

Open the Play SQL UI at `http://<host>:8123/play` and log in with `CLICKHOUSE_USER` / `CLICKHOUSE_PASSWORD`. Or connect with the native client:

```sh
podman exec -it <container> clickhouse-client --user admin --password <CLICKHOUSE_PASSWORD>
```

Drivers and BI tools use port `8123` (HTTP) or `9000` (native). The user, password and database are created on first boot only; change them later with `ALTER USER`, not by editing `.env`.

Don't expose `9000` to the internet: the native protocol is unencrypted. Put the HTTP port behind a TLS reverse proxy instead.
