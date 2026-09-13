Open `http://<server-ip>:8080/web/admin` and sign in with `SFTPGO_ADMIN_USERNAME` and `SFTPGO_ADMIN_PASSWORD`. Create an SFTP user there; local homes are stored in the `sftpgo_data` named volume.

In FileZilla, create a new site with:

- Protocol: `SFTP - SSH File Transfer Protocol`
- Host: `<server-ip>` (for example, `192.168.1.50`)
- Port: `2022` (or your `SFTPGO_SFTP_PORT`)
- Logon Type: `Normal`
- User: the SFTP user created in SFTPGo
- Password: that user's password
