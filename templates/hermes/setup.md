# After deploying

Hermes stores its config, provider API keys and memories in the `hermes_data` volume (`/opt/data`). Configure a model provider and any chat platforms (Telegram, Discord, Slack, WhatsApp) by running the setup wizard once inside the container:

```sh
podman exec -it <container> hermes setup
```

Then restart the container. The dashboard is on the primary port; the OpenAI-compatible API is at `http://<host>:8642/v1` with `Authorization: Bearer <API_SERVER_KEY>`.

Set `API_SERVER_ENABLED=false` if you only use chat platforms, and don't expose port 8642 to the internet without a strong key.
