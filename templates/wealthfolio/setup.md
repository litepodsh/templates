# Wealthfolio

Wealthfolio is single-user and has no username.

1. Read the generated `WF_PASSWORD` from the app's environment variables.
2. Open the app's domain and sign in with it.

To change the password, edit `WF_PASSWORD` and redeploy. The
`wealthfolio-auth` container hashes it with Argon2id before the app starts.

`WF_SECRET_KEY` encrypts stored broker and API credentials. Back it up with
the `wealthfolio_data` volume; without it those secrets can't be decrypted.

Market data comes from Yahoo Finance by default. Other providers and API keys
are set in **Settings → Market Data**.
