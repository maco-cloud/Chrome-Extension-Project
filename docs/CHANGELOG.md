# Changelog

## 2.1.0 — YouTube transcript summaries

### Added
- YouTube watch page detection (`/watch`, `/shorts/`, `/embed/`)
- On-device transcript extraction from YouTube caption tracks (no external APIs)
- Video summaries with TL;DR, bullet summary, key takeaways, and action items
- **Key moments** with clickable timestamps that open the video at that point
- YouTube-specific popup UI (badge, status banner, themed empty state)
- Loading states: “Extracting transcript…” and “Generating summary…”
- Graceful errors when captions are missing, restricted, or the player is still loading

### Improved
- Reuses the existing local/Chrome AI summarization pipeline for transcript text
- Extraction waits for dynamically loaded YouTube player data (SPA navigation)
- Export and copy-all include key moments when present

### Permissions
- No new permissions — still uses `activeTab` + `scripting` on user action

## 2.0.0 — Chrome Web Store quality release

### Added
- TL;DR, bullet summary, sentiment, and language detection
- Summarize selected text (popup, context menu, keyboard shortcut)
- Copy all and export summary as `.txt`
- Pin favorites, search history, recent pages list
- Extraction cache and duplicate-request guard
- Context menus and keyboard shortcuts
- Improved accessibility (ARIA, focus states, keyboard navigation)

### Improved
- Local summarization scoring and deduplication
- Content extraction (link-density filtering, more noise removal)
- Premium popup UI animations and layout
- Error messages for restricted/incognito pages
- README, privacy policy, and store listing assets

### Permissions
- Added `contextMenus` (summarize page/selection from right-click)

## 1.1.0
- Removed OpenAI dependency; local + Chrome on-device AI only

## 1.0.0
- Initial QuickDigest AI MVP
