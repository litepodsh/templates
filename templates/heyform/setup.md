# `APP_HOMEPAGE_URL`

HeyForm builds every internal link and auth redirect from
`HEYFORM_APP_HOMEPAGE_URL`, so it must match how you actually reach the app:

- Local only: `http://localhost:8000`
- LAN: `http://<server-ip>:8000`
- Public / behind LitePod's proxy: `https://forms.example.com`

A mismatch shows up as a login page that reloads without signing you in.

# Secrets

- `HEYFORM_SESSION_KEY` — signs session cookies.
- `HEYFORM_FORM_ENCRYPTION_KEY` — must be **exactly 32 characters**; encrypts
  form submissions.

# Data

MongoDB data is in `heyform_mongo_data`, KeyDB in `heyform_keydb_data`, and
uploaded images in `heyform_assets`. The first account registered is the
instance owner; SMTP can be configured later from the admin settings.
