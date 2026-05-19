# QuickDigest AI

QuickDigest AI is a **privacy-first** Chrome Extension (Manifest V3) that summarizes webpages on your device—no account, no API key, no tracking, no backend.

**Version 2.1.0** — YouTube transcript summaries + Chrome Web Store quality release.

## Features

- **YouTube transcript summaries** on watch pages — TL;DR, key moments with timestamps, bullets, takeaways, and action items (no external APIs)
- **One-click page summaries** with TL;DR, summary, bullets, takeaways, and action items
- **Summarize selected text** (popup, context menu, `Ctrl+Shift+Y`)
- **Local engine** (always free) + optional **Chrome on-device AI**
- Reading time, sentiment, and language hints
- Copy section / **copy all** / **export `.txt`**
- History with **pin**, **search**, and **recent pages**
- Dark mode, keyboard shortcuts, premium UI
- Extraction cache and robust error handling

## Tech stack

- Manifest V3, vanilla HTML/CSS/JS (ES modules)
- Service worker + content extractor + offscreen Chrome AI worker
- `chrome.storage.local` + `chrome.storage.session`

## Project structure

```text
manifest.json
website/          maco-crafts.gg brand site (GitHub Pages)
docs/
  CHANGELOG.md
  privacy-policy.md
  store-listing.md
src/
  background/     service-worker, offscreen AI
  content/        extractor.js, youtube-extractor.js
  popup/          UI
  options/        settings
  styles/
  utils/          text, storage, summarizer, cache, export
```

## Install (developer mode)

1. Clone: `git clone https://github.com/maco-cloud/Chrome-Extension-Project.git`
2. Open `chrome://extensions` → **Developer mode** → **Load unpacked**
3. Select the repo root (contains `manifest.json`)

## Usage

| Action | How |
|--------|-----|
| Summarize page | Extension icon → **Summarize page** or `Ctrl+Shift+S` |
| Summarize YouTube video | Open a YouTube watch page → **Summarize video** (same shortcut) |
| Summarize selection | Select text → **Selection** or `Ctrl+Shift+Y` |
| Context menu | Right-click page or selection |
| Copy / export | Buttons appear after summarization |
| Settings | Gear icon → engine, dark mode, shortcuts help |

## Summary engines

| Engine | Description |
|--------|-------------|
| **Auto** | Chrome on-device AI when available, else local |
| **Local** | Always works; on-device extractive summarization |
| **Chrome AI** | Built-in Summarizer API (Chrome 138+, device dependent) |

## Permissions

- `storage`, `activeTab`, `scripting`, `offscreen`, `contextMenus`
- **No** external host permissions

## Publishing

See [docs/store-listing.md](docs/store-listing.md) for copy, keywords, and screenshot ideas.

**Privacy policy (Chrome Web Store):** https://maco-cloud.github.io/Chrome-Extension-Project/privacy.html  
**Product page:** https://maco-cloud.github.io/Chrome-Extension-Project/quickdigest.html  
Source: [docs/privacy-policy.md](docs/privacy-policy.md) · Deploy: [website/README.md](website/README.md)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Not enough content | Use a text-rich article |
| YouTube: no transcript | Use a video with captions/subtitles enabled |
| YouTube: still loading | Wait for the player to finish loading, then retry |
| Restricted page | Avoid `chrome://`, Web Store, PDFs |
| Chrome AI unavailable | Use Auto or Local in Settings |
| Incognito | Enable extension in incognito on `chrome://extensions` |
| Shortcuts | Customize at `chrome://extensions/shortcuts` |

## Roadmap (architecture-ready)

- PDF summarization
- Optional AI provider plugins
- Multi-language output
- Offline packaged models

## License

Provided as-is for development and publishing by the repository owner.
