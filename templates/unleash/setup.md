# First run

Unleash seeds an initial admin user on first boot. Log in at `http://localhost:4242` with:

- **Username:** `admin`
- **Password:** `unleash4all`

Change the password immediately after the first login.

# Client SDKs

Create an API token under **Settings → API access** for each environment you want to use.
Scope production clients to their own project and environment instead of using the root
token. SDKs (Go, Node, Python, Java, …) point at `http://localhost:4242/api/`.

# Login method

`AUTH_TYPE` defaults to `open-source`, which is username + password with no SSO. Set
`custom` to plug in an external authentication hook.