# Stirling PDF

Open port 8080 — the toolkit is ready with no configuration. Everything runs
locally; uploaded files are processed in memory and not persisted.

## Volumes

| Volume | Path | Purpose |
| ------ | ---- | ------- |
| `stirling_tessdata` | `/usr/share/tessdata` | OCR language data |
| `stirling_configs` | `/configs` | `settings.yml`, generated on first start |
| `stirling_custom` | `/customFiles` | custom static files, templates, fonts |

## Login system

Set `STIRLING_PDF_ENABLE_SECURITY=true` to require authentication. On the next
start Stirling PDF creates an initial admin (`admin` / `stirling`) — log in and
change it immediately under **Account Settings**. User accounts and API keys are
stored in the `stirling_configs` volume.

## OCR languages

`STIRLING_PDF_LANGS` lists Tesseract language packs to fetch, space-separated,
e.g. `en_GB de_DE fr_FR`. The default is `en_GB` only.
