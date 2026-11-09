Plane Community is the open-source edition: unlimited users, with the same features as Plane's free cloud plan.

**The official iOS and Android apps don't work with this edition.** Signing in with a Community URL returns a 404. On a phone, open your Plane URL in the browser and add it to the home screen. If you need the native app, deploy the **Plane Commercial** template instead.

## Create the first account

Plane has no default login. The first account is created in its admin panel, called God Mode.

**Do this as soon as the app is up.** Until an admin exists, anyone who opens your URL can claim the instance. The first boot runs database migrations and can take a few minutes.

1. Open your Plane URL with `/god-mode/` at the end, for example `https://plane.example.com/god-mode/`.
2. Fill in your name, email, company name and a strong password, then press **Continue**. This creates the instance admin, and the form only works once. After that the same page is the admin sign-in.
3. Open your Plane URL without `/god-mode/` and sign in with the same email and password.
4. Create your first workspace, then invite your team from its settings.

Anyone with your URL can register by default. To allow invited users only, go to `/god-mode/authentication/` and turn off **Allow anyone to sign up even without an invite**.

## Domains

Plane has two public addresses: the **app** (primary port) and **file storage** (port 9000). Browsers upload and download attachments directly from storage, and the Plane server reaches it through that same public address.

If you add a custom domain, add one to both routes and use HTTPS on both. An HTTPS app can't upload to a storage address on plain HTTP.

## Email

Invitations and magic links need SMTP. Set it up in `/god-mode/` under Email.

## Upload limit

Attachments are limited to 5 MB. Change `PLANE_FILE_SIZE_LIMIT` (in bytes) and redeploy to raise it.

## Not included

Compared with Plane's paid plans, this edition has no wiki, work item types, time tracking, dashboards, initiatives, teamspaces, integrations, workflows or SAML/OIDC single sign-on.
