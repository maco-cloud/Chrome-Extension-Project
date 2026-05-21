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

The policy files must be on `main` **and** Pages must be turned on. A 404 usually means Pages is not enabled yet.

### Option A — GitHub Actions (recommended)

1. Confirm `privacy-policy.html`, `privacy-policy.css`, `.nojekyll`, and `.github/workflows/deploy-privacy-pages.yml` are on `main`.
2. Open **github.com/maco-cloud/Chrome-Extension-Project** → **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch”).
4. Go to **Actions** → run **Deploy privacy policy to GitHub Pages** (or push any commit to `main` to trigger it).
5. Wait until the workflow shows a green checkmark (1–3 minutes).
6. On the **Pages** settings screen, copy the live site URL (shown after first successful deploy).

### Option B — Deploy from branch

1. **Settings** → **Pages** → **Source:** **Deploy from a branch**
2. **Branch:** `main` · **Folder:** `/docs` → **Save** (privacy files live in `docs/`)
3. Wait 2–10 minutes for the first build.

### Verify

Open in an incognito window (no login):

`https://maco-cloud.github.io/Chrome-Extension-Project/privacy-policy.html`

You should see the dark **QuickDigest AI Privacy Policy** page—not GitHub’s generic “404 / There isn’t a GitHub Pages site here.”

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
