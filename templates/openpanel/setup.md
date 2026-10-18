# OpenPanel

OpenPanel uses two domains: the **dashboard** (port `3000`) and the **event
API** (port `3001`). SDKs and the tracking script send events to the API
domain (`apiUrl` option).

## Domains

The login cookie is set on the dashboard's parent domain
(`analytics.example.com` -> `.example.com`) and the API must be able to read
it. Generated `litepod-*.sslip.io` domains already share `.sslip.io`. When you
add your own domains, put both under the same parent, for example:

- dashboard: `analytics.example.com`
- API: `analytics-api.example.com`

## First account

Open the dashboard and create the first account; it becomes the organization
owner. After that, registration is closed (`OPENPANEL_ALLOW_REGISTRATION=false`),
so add teammates with invites. Create a client per app in
**Project → Settings → Clients**.

Email (invites, password resets) needs `OPENPANEL_EMAIL_SENDER` and
`OPENPANEL_RESEND_API_KEY`.
