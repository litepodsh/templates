# Before deploying

Set `PASTEFY_SERVER_NAME` to Pastefy's public URL and replace both database-password placeholders. Pastefy currently requires a MySQL-compatible database; this template includes an isolated MySQL service with persistent named storage.

Authentication is disabled by default (`PASTEFY_AUTH_PROVIDER=NONE`). Configure an OAuth provider only after setting the matching public URL, so callback URLs are correct.
