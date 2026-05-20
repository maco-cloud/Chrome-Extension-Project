# Maco Apps — Google Sites build guide

**Your site:** https://sites.google.com/view/maco-apps

**Chrome Web Store privacy URL (use after you publish page 4):**

```
https://sites.google.com/view/maco-apps/privacy-policy
```

---

## Step 1 — Reset the template (~5 min)

1. Open https://sites.google.com/view/maco-apps → **Edit** (pencil).
2. **Pages** (left) → delete **Schedule**, **Speakers**, **Venue**.
3. Rename **Home** → keep as **Home**.
4. Add pages:
   - **Apps**
   - **QuickDigest AI**
   - **Privacy Policy**
5. **Themes** → pick **Impression** or **Diplomat** → colors:
   - Primary: `#0071e3`
   - Background: dark or light (your choice)

---

## Step 2 — Site name & header

- Site name: **Maco Apps**
- Tagline: **Privacy-first apps & extensions**
- Logo: upload `src/assets/icons/icon128.png` from this repo (QuickDigest icon works until you have a Maco logo)

---

## Step 3 — Copy each page

Open the matching file and paste sections into Google Sites text blocks (or use **Embed → Embed code** with `maco-apps-embed.html` on Home only).

| Page | Content file |
|------|----------------|
| Home | [page-home.md](page-home.md) |
| Apps | [page-apps.md](page-apps.md) |
| QuickDigest AI | [page-quickdigest.md](page-quickdigest.md) |
| Privacy Policy | [page-privacy-policy.md](page-privacy-policy.md) |

---

## Step 4 — Navigation

Order in site menu:

1. Home  
2. Apps  
3. QuickDigest AI  
4. Privacy Policy  

Footer on every page: link **Privacy Policy** + **Support (GitHub Issues)**.

---

## Step 5 — Publish

1. **Publish** → **Web address:** `maco-apps` (already set)  
2. **Who can view:** **Anyone on the web**  
3. **Publish**

Test in Incognito:

- https://sites.google.com/view/maco-apps  
- https://sites.google.com/view/maco-apps/privacy-policy  

---

## Chrome Web Store fields

| Field | URL |
|-------|-----|
| Privacy policy | `https://sites.google.com/view/maco-apps/privacy-policy` |
| Homepage | `https://sites.google.com/view/maco-apps/quickdigest-ai` or main site |
| Support | `https://github.com/maco-cloud/Chrome-Extension-Project/issues` |

---

## Optional — Full-page embed (fastest “awesome” layout)

1. Host `maco-apps-embed.html` on GitHub Pages (already in repo under `docs/google-sites/`).  
2. On Google Sites **Home** → **Insert** → **Embed** → paste the published raw HTML URL or upload sections manually.

Manual copy-paste from the markdown files usually looks more “native” in Google Sites.
