# Chrome Web Store — unblock publishing

Google blocked you for three reasons. Fix **#2 and #3** in your browser (we cannot sign in as you). Fix **#1** with **Option A** or **Option B**.

---

## 1. Privacy policy link not reachable

Google needs a public **HTTPS** page that returns **200** (not 404). Use **one** of these:

### Option A — GitHub Pages (recommended if you use GitHub)

**Privacy URL to paste in the store:**

```
https://maco-cloud.github.io/Chrome-Extension-Project/privacy.html
```

**You must enable Pages once (signed into GitHub):**

1. https://github.com/maco-cloud/Chrome-Extension-Project/settings/pages  
2. **Build and deployment** → **Source** → **GitHub Actions**  
3. https://github.com/maco-cloud/Chrome-Extension-Project/actions/workflows/deploy-website.yml  
4. **Run workflow** → branch `main` → **Run workflow**  
5. Wait ~2 minutes for a green checkmark  
6. Test in **Incognito**: the privacy URL above must load (not “Site not found”)

**If Actions fails:** Settings → Pages → **Deploy from a branch** → `main` → folder **`/docs`** → Save. Same privacy URL.

> Your repo can stay **private**; the Pages *site* is still public on `github.io`.

---

### Option B — Google Sites (fastest, same Google account as the store)

No GitHub Pages required.

1. Open https://sites.google.com → **Blank** site  
2. Open [`privacy-google-sites-copy.txt`](privacy-google-sites-copy.txt) in this folder → copy all text → paste into the page  
3. Title the site **QuickDigest AI Privacy**  
4. Click **Publish** → set visibility to **Anyone on the web**  
5. Copy the published URL (example: `https://sites.google.com/view/quickdigest-privacy/home`)  
6. Paste **that URL** as the Chrome Web Store **Privacy policy** link  

Test in Incognito before submitting.

---

## 2. Contact email required

1. Open https://chrome.google.com/webstore/devconsole/settings  
2. Sign in with the same Google account you use for the developer account  
3. Find **Contact email** / **Publisher contact email**  
4. Enter an email you control (your Gmail is fine) → **Save**

---

## 3. Verify contact email

1. Check that email inbox (and spam) for a message from Google / Chrome Web Store  
2. Click the **verification link**  
3. Return to https://chrome.google.com/webstore/devconsole/settings — status must show **verified**

Until verified, publishing stays blocked.

---

## Listing fields (after privacy URL works)

| Field | Value |
|-------|--------|
| **Privacy policy** | GitHub Pages URL (Option A) **or** your Google Sites URL (Option B) |
| **Support URL** | `https://github.com/maco-cloud/Chrome-Extension-Project/issues` |
| **Mature content** | No |

---

## Package zip for upload

From repo root in PowerShell:

```powershell
.\scripts\build-store-zip.ps1
```

Upload `dist\quickdigest-ai-store.zip` in the developer dashboard.

---

## Final steps

1. Paste working privacy URL → **Save draft**  
2. Confirm email verified in Settings  
3. **Submit for review**
