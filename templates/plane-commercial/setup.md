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

**Do this as soon as the app is up.** Until an admin exists, anyone who opens your URL can claim the instance. The first boot runs database migrations and can take 10 minutes or more, so wait until the app is reported as healthy.

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

## Paid plans

Buy a key at [prime.plane.so](https://prime.plane.so) and activate it under **Workspace Settings → Billing and plans**. The server must reach `prime.plane.so` on port 443. A key is bound to `PLANE_MACHINE_SIGNATURE` and applies to one workspace.

## Email

Invitations and magic links need SMTP. Set it up in `/god-mode/` under Email.

## Upload limit

Attachments are limited to 5 MB. Change `PLANE_FILE_SIZE_LIMIT` (in bytes) and redeploy to raise it.
