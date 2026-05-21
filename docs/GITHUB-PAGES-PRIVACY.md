# GitHub Pages — QuickDigest AI Privacy Policy

Public privacy policy for Chrome Web Store submission. Files live at the **repository root** on the `main` branch.

## Files

| File | Purpose |
|------|---------|
| `privacy-policy.html` | Policy page (store submission URL) |
| `privacy-policy.css` | Dark theme styles |
| `.nojekyll` | Disables Jekyll so GitHub Pages serves files as-is |

## Final public URL

After GitHub Pages is enabled:

```
https://maco-cloud.github.io/Chrome-Extension-Project/privacy-policy.html
```

Use this exact URL in the Chrome Web Store **Privacy policy** field.

> If you rename the repository or change the GitHub username, the URL path changes accordingly (`https://<user>.github.io/<repo>/privacy-policy.html`).

## GitHub Pages setup (one-time)

1. Push `privacy-policy.html`, `privacy-policy.css`, and `.nojekyll` to `main` on GitHub.
2. Open the repo: **github.com/maco-cloud/Chrome-Extension-Project**
3. **Settings** → **Pages** (left sidebar)
4. Under **Build and deployment** → **Source**:
   - **Deploy from a branch**
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Click **Save**
6. Wait 1–5 minutes for the first deploy (GitHub shows the site URL on the Pages settings page)
7. Verify in a private/incognito window (no login required):
   - Open `https://maco-cloud.github.io/Chrome-Extension-Project/privacy-policy.html`
   - Confirm **QuickDigest AI** title, Stripe / Worker / Resend sections, and support email

### Optional: custom domain

If you later point a domain (e.g. `maco-crafts.gg`) to GitHub Pages, update the store listing to the custom URL path you configure. The root-folder layout still works.

## Chrome Web Store resubmission

1. **Developer Dashboard** → your QuickDigest AI item → **Privacy**
2. Set **Privacy policy URL** to:
   ```
   https://maco-cloud.github.io/Chrome-Extension-Project/privacy-policy.html
   ```
3. **Store listing** → confirm support email: `maco70090@gmail.com`
4. **Privacy practices** questionnaire — align with the policy:
   - Single purpose: summarization
   - Data: license validation (key + device id), purchase email via Stripe webhook
   - No sale of data; no ads
   - Summarization on-device; optional Chrome AI per Google policy
5. **Save** → **Submit for review** (or resubmit if rejected for privacy URL)

## Updating the policy

1. Edit `privacy-policy.html` (and `privacy-policy.css` if needed)
2. Update the **Last updated** date in the HTML
3. Commit and push to `main`
4. GitHub Pages redeploys automatically within a few minutes
5. No Chrome Web Store resubmission required for minor text fixes unless reviewers request it

## Checklist before submit

- [ ] Pages enabled from `main` / root
- [ ] URL loads without GitHub login
- [ ] Page identifies **QuickDigest AI** and version
- [ ] Covers Stripe, Cloudflare Worker, Resend, local storage, permissions
- [ ] States no sale of data and no third-party ads
- [ ] Support email `maco70090@gmail.com` is visible and clickable
