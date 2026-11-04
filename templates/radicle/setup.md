A seed node keeps Radicle repositories available and serves them to other peers. It has no web UI of its own, and you still create repositories from the `rad` CLI on your computer.

Open `RADICLE_P2P_PORT` in your server's firewall, or peers can't connect to your node.

## Choose what to replicate

With the default `RADICLE_SEEDING_POLICY=block`, the node only replicates repositories you pick. From the `node` terminal:

```sh
rad seed rad:z3gqcJUoA1n9HaHKufZs5FCSGazv5
```

`allow` replicates every repository the node finds on the network, which can use a lot of disk.

## Browse repositories

Add a domain with a certificate, then open `https://radicle.network/nodes/<your-domain>`. That public explorer can't read your node over plain `http`.

Clone over HTTP with `git clone <your-url>/<repository-id>.git`, leaving out the `rad:` prefix.

## Back up the identity

The `radicle_home` volume holds your node's private key, in `keys/radicle`, without a passphrase. Your node's ID comes from it, so losing it means peers see a different node. Keep backups private.

Configure the node through `.env`: `config.json` is rewritten on every start, so changes from `rad config edit` don't last.
