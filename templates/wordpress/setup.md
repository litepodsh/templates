# WordPress

Open the site and run the standard install wizard to create the admin account.
Files (themes, plugins, uploads) persist in `wordpress_data`; the database in
`mariadb_data`.

- Replace `WORDPRESS_DB_PASSWORD` and `WORDPRESS_DB_ROOT_PASSWORD` before first
  start — MariaDB only reads them when initialising an empty data volume.
- Behind a reverse proxy that terminates TLS, add to `wp-config.php` (in the
  `wordpress_data` volume) so WordPress builds `https://` URLs:

  ```php
  if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
      $_SERVER['HTTPS'] = 'on';
  }
  ```

- Default upload limit is 2 MB. Raise it with an `PHP_INI` drop-in or a
  `.htaccess` / `uploads.ini` mount if you need larger media.
