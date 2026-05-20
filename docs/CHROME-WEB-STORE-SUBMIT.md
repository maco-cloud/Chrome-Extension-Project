# Chrome Web Store — finish publishing

## Privacy policy URL (paste in your listing)

After GitHub Pages is enabled (step 2), use:

```
https://maco-cloud.github.io/Chrome-Extension-Project/privacy.html
```

Test in an **Incognito** window before submitting. Google must get HTTP **200**, not 404.

---

## Step 1 — Push latest code to GitHub

If you use GitHub Desktop: **Fetch** → **Push origin**.

Or in terminal (from project folder):

```powershell
git push origin main
```

---

## Step 2 — Turn on GitHub Pages (free, ~2 min)

1. Open: https://github.com/maco-cloud/Chrome-Extension-Project/settings/pages
2. **Build and deployment** → **Source** → **GitHub Actions**
3. Open: https://github.com/maco-cloud/Chrome-Extension-Project/actions/workflows/deploy-website.yml
4. **Run workflow** → branch `main` → **Run workflow**
5. Wait for green checkmark (~1–2 min)
6. Return to **Settings → Pages** — confirm the site URL is shown

**Fallback (if Actions fails):** On Settings → Pages, choose **Deploy from a branch** → branch `main` → folder **`/docs`** → Save. Then use the same privacy URL above.

---

## Step 3 — Publisher contact email (required by Google)

You must do this yourself; we cannot access your Google account.

1. Open: https://chrome.google.com/webstore/devconsole/settings
2. Find **Contact email** / **Publisher contact email**
3. Enter an email you control (Gmail is fine)
4. Click **Save**
5. Open that inbox and click Google’s **verification link**
6. Return to the dashboard — email must show as **verified**

Until this is verified, publishing stays blocked.

---

## Step 4 — Extension listing fields

| Field | Value |
|-------|--------|
| Privacy policy | `https://maco-cloud.github.io/Chrome-Extension-Project/privacy.html` |
| Support URL | `https://github.com/maco-cloud/Chrome-Extension-Project/issues` |
| Mature content | No |

---

## Step 5 — Save draft and submit

1. Paste the privacy URL in the listing **Privacy** section
2. **Save draft**
3. Fix any remaining errors
4. **Submit for review**

---

## If privacy URL still “not reachable”

- Wait 5–10 minutes after Pages deploy
- Test URL in Incognito
- Confirm repo is **Public** (private repos block public Pages for free tier in some cases)
- Try fallback branch deploy from `/docs` (step 2)
