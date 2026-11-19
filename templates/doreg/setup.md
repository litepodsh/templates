# First login

On first start doreg creates the admin from `DOREG_ADMIN_USER` /
`DOREG_ADMIN_PASSWORD` (a random password generated when the app was created,
visible in the app's environment). This only happens while the database has no
users; changing the variable later does not reset the password.

# Push an image

Docker and Podman only send credentials over HTTPS, so use the app's public
domain:

```sh
podman login registry.example.com -u admin
podman tag my-app registry.example.com/my-app:1.0
podman push registry.example.com/my-app:1.0
```

Create a project in the UI first if the repository path needs one, and use a
robot account for CI.

# Large pushes

Layer uploads can take minutes. If pushes time out, raise the read/idle
timeouts of any proxy in front of LitePod's Caddy.

# Single sign-on

OIDC is optional and not enabled here. To add it, set `OIDC_ISSUER`,
`OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` and `OIDC_REDIRECT_URI`
(`<public url>/api/auth/oidc/callback`) under `environment:` in the compose.
