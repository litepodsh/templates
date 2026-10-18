# Aptabase

Aptabase has no default account and no passwords: sign-in works through
email magic links.

1. Open the app's domain and register with your email.
2. Without SMTP configured, the activation link is printed to the `aptabase`
   container logs. Open it to activate the account.
3. Create an app and copy its **App Key** (`A-SH-...`).

## Sending events

Self-hosted keys need the server URL in the SDK's `host` option. Electron
example:

```js
import { initialize } from "@aptabase/electron/main";
initialize("A-SH-XXXXXXXXXX", { host: "https://<your-domain>" });
```

### Tauri

Add the plugin to `src-tauri/Cargo.toml` and the JS bindings to the frontend:

```toml
[dependencies]
tauri-plugin-aptabase = "1.3.0"
```

```sh
npm add @aptabase/tauri
```

Register it in `src-tauri/src/main.rs` with your server as `host`:

```rust
use tauri_plugin_aptabase::{EventTracker, InitOptions};

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_aptabase::Builder::new("A-SH-XXXXXXXXXX")
                .with_options(InitOptions {
                    host: Some("https://<your-domain>".into()),
                    flush_interval: None,
                })
                .build(),
        )
        .setup(|app| {
            app.track_event("app_started", None);
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|handler, event| {
            if let tauri::RunEvent::Exit { .. } = event {
                handler.track_event("app_exited", None);
                handler.flush_events_blocking();
            }
        });
}
```

Allow the command in `src-tauri/capabilities/default.json`:

```json
{ "permissions": ["core:default", "aptabase:allow-track-event"] }
```

Then track events from the frontend:

```js
import { trackEvent } from "@aptabase/tauri";

trackEvent("screen_view", { name: "Settings" });
```

Only string and number property values are accepted. Nothing is tracked
automatically, so send at least one event at startup.

Set `APTABASE_SMTP_*` to send magic links by email instead of reading them
from the logs.
