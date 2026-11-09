Plane Commercial is the closed-source edition that works with the official iOS and Android apps. It starts on the Free plan, limited to 12 users per workspace, and needs no license key.

## Before you rely on it

- Using this software in production is subject to [Plane's EULA](https://plane.so/legals/eula). Read it before running this for a team.
- Plane documents this all-in-one image for evaluations and proofs of concept. For large teams, it recommends its own Docker Compose or Kubernetes install.
- Use a server with at least 8 GB of RAM. The Plane container alone uses close to 4 GB.

## Domains come first

Plane has two public addresses: the **app** (primary port) and **file storage** (port 9000). Browsers and the mobile app reach attachments directly on storage, and the Plane server uses that same public address.

Add a custom domain with HTTPS to **both** routes, then redeploy. The mobile app needs a valid certificate on these addresses, and an HTTPS app can't upload to a storage address on plain HTTP.

## Create the first account

Plane has no default login. The first account is created in its admin panel, called God Mode.

**Do this as soon as the app is up.** Until an admin exists, anyone who opens your URL can claim the instance. The first boot runs database migrations and can take 10 to 30 minutes. Until they finish the page can load while the form fails with 502 errors, so retry until it works.

1. Open your Plane URL with `/god-mode/` at the end, for example `https://plane.example.com/god-mode/`.
2. Fill in your name, email, company name and a strong password, then press **Continue**. This creates the instance admin, and the form only works once. After that the same page is the admin sign-in.
3. Open your Plane URL without `/god-mode/` and sign in with the same email and password.
4. Create your first workspace, then invite your team from its settings. Each workspace on the Free plan holds up to 12 users.

To control who can register, go to `/god-mode/authentication/` and review **Allow anyone to sign up even without an invite**.

## Connect the mobile app

1. Install **Plane** from the App Store or Google Play.
2. Tap **Self hosted sign in** and enter your Plane URL.
3. Sign in with your Plane email and password.

For Google or GitHub sign-in on mobile, add `https://<your-domain>/auth/mobile/google/callback/` or `https://<your-domain>/auth/mobile/github/callback/` to your OAuth app.

Push notifications are only available on Plane Cloud, so the app shows new activity in its Inbox instead. Editing needs a connection.

## Connect Claude and ChatGPT

Plane's MCP server lets AI clients read and change your work items, with the permissions of the user who signs in. It is optional and off by default, because it needs an OAuth app that only exists once Plane is running.

The steps below use `mcp.example.com`. Replace it with a domain of your own that points to this server.

### 1. Create the OAuth app in Plane

In your workspace, open **Settings → Integrations** (`/<workspace>/settings/integrations/`) and click **Build your own**. Fill in:

| Field | Value |
| ----- | ----- |
| **Setup URL** | `https://mcp.example.com` |
| **Redirect URI** | `https://mcp.example.com/http/auth/callback https://mcp.example.com/auth/callback` |
| **Webhook URL** | Leave empty |
| **Scopes & permissions** | Read and Write on the **All workspace resources** row |

Save it and copy the **Client ID** and **Client Secret**.

### 2. Turn on the services

In this app's compose file, uncomment the `plane-mcp` and `plane-mcp-valkey` services and the `plane_mcp_valkey_data` volume at the end. Remove only the leading `# `, so the indentation stays aligned with the other services.

### 3. Add the variables

Add these to the app's environment variables:

| Variable | Value |
| -------- | ----- |
| `PLANE_MCP_URL` | `https://mcp.example.com`, with no trailing slash |
| `PLANE_MCP_CLIENT_ID` | The Client ID from step 1 |
| `PLANE_MCP_CLIENT_SECRET` | The Client Secret from step 1 |

The MCP server exits at startup without a Client ID and Secret.

### 4. Add the domain and redeploy

Add `mcp.example.com` to this app on port **8211** with HTTPS, then redeploy. Plane restarts during the redeploy, so it can be unavailable for a few minutes.

To confirm it works, open `https://mcp.example.com/.well-known/oauth-protected-resource/http/mcp`. It should return JSON that contains your domain.

### 5. Connect your AI client

Every client uses the address `https://mcp.example.com/http/mcp` and signs in through Plane.

- **Claude:** go to **Settings → Connectors → Add custom connector** and paste the address. On Team or Enterprise plans, an Owner adds it under **Organization settings → Connectors**.
- **Claude Code:** run `claude mcp add --transport http plane https://mcp.example.com/http/mcp`, then authenticate with `/mcp`.
- **ChatGPT:** needs a paid plan. Turn on **Developer mode** under **Settings → Security and login**, then create the connector at **chatgpt.com/plugins**. On Business, Enterprise and Edu workspaces, an admin must allow it first.

### If something fails

- **`invalid_scope`:** the OAuth app uses granular scopes. Tick Read and Write on **All workspace resources** instead.
- **Redirect error at sign-in:** the Setup URL, Redirect URI and `PLANE_MCP_URL` must all use the same domain.
- **The `plane-mcp` container keeps restarting:** check that `PLANE_MCP_CLIENT_ID` and `PLANE_MCP_CLIENT_SECRET` are set.

## Paid plans

Buy a key at [prime.plane.so](https://prime.plane.so) and activate it under **Workspace Settings → Billing and plans**. The server must reach `prime.plane.so` on port 443. A key is bound to `PLANE_MACHINE_SIGNATURE` and applies to one workspace.

## Email

Invitations and magic links need SMTP. Set it up in `/god-mode/` under Email.

## Upload limit

Attachments are limited to 5 MB. Change `PLANE_FILE_SIZE_LIMIT` (in bytes) and redeploy to raise it.
