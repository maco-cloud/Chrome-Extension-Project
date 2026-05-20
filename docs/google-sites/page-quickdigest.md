# QUICKDIGEST AI PAGE

---

## Hero

**QuickDigest AI**  
*The gist of any page — on your device.*

**Short description (store-style):**  
Summarize any webpage instantly on your device. Free, private, no account, no API key, no tracking.

**Primary button:** Get it on Chrome Web Store → (your store URL when published)

**Secondary button:** Privacy Policy → internal **Privacy Policy** page

---

## Why QuickDigest AI

- **No account** — install and use  
- **No paid API keys** — local engine included  
- **No backend** — we don't operate servers for your content  
- **No ads or analytics** in the extension  

---

## What you get

| Feature | Description |
|---------|-------------|
| TL;DR | One-line essence of the page or video |
| Full summary | Readable narrative brief |
| Bullets | Scannable list |
| Takeaways & actions | What matters + what to do next |
| YouTube | Transcript-based summaries + **key moments** (jump to timestamp) |
| Selection mode | Summarize highlighted text only |
| Export | Copy sections or download `.txt` |
| History | Pin, search, recent pages |

---

## How it works

1. Open any article or YouTube watch page.  
2. Click the extension → **Summarize page** (or `Ctrl+Shift+S` / `Cmd+Shift+S`).  
3. Summary is generated **on your device** using:  
   - **Local engine** (always available), and/or  
   - **Chrome on-device AI** (when your browser supports it).  

Your article text is **not** sent to Maco Apps servers — we don't run any.

---

## Permissions (plain English)

| Permission | Why |
|------------|-----|
| storage | Save settings & history on your device |
| activeTab | Read the current tab only when you click summarize |
| scripting | Extract readable text from the page |
| offscreen | Run Chrome's on-device AI summarizer when available |
| contextMenus | Right-click → summarize page or selection |

---

## Keyboard shortcuts

- **Summarize page:** Ctrl+Shift+S (Windows) / Cmd+Shift+S (Mac)  
- **Summarize selection:** Ctrl+Shift+Y / Cmd+Shift+Y  

Customize at `chrome://extensions/shortcuts`

---

## Technical notes (portfolio)

Built together as a **Manifest V3** extension: service worker, content scripts, offscreen document for Chrome AI, extraction cache, YouTube caption pipeline — vanilla HTML/CSS/JS, no framework bloat.

**Version:** 2.1.0  
**Repo:** https://github.com/maco-cloud/Chrome-Extension-Project  

---

## Support

https://github.com/maco-cloud/Chrome-Extension-Project/issues
