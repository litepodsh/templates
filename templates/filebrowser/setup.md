# First login

On the very first start (empty `filebrowser_database` volume) File Browser
creates an `admin` user. Depending on the image version the password is either
`admin` or a random string printed once in the container logs — check the logs,
then change it immediately under *Settings → User Management*.

# What it serves

`FB_ROOT` (default `/srv`) is the only directory exposed. This template mounts
the empty `filebrowser_srv` volume there. To manage another stack's files,
replace that mount with the stack's named volume:

```yaml
    volumes:
      - immich_upload:/srv
      - filebrowser_database:/database
```
