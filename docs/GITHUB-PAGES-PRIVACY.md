# GitHub Pages — QuickDigest AI Privacy Policy

The public site is deployed from the **`website/`** folder via the **Deploy website** GitHub Actions workflow.

## Chrome Web Store URL

```
https://maco-cloud.github.io/Chrome-Extension-Project/privacy-policy.html
```

Legacy redirect: `.../privacy.html` → `privacy-policy.html`

## Source files

| File | Purpose |
|------|---------|
| `website/privacy-policy.html` | Full policy (edit this for updates) |
| `website/privacy-policy.css` | Dark theme styles |
| `website/privacy.html` | Redirect to `privacy-policy.html` |

## Setup (one-time)

1. **Settings** → **Pages** → **Source:** **GitHub Actions**
2. **Actions** → **Deploy website** → **Run workflow** (branch `main`)
3. Wait for green checkmark (~1–2 min)
4. Verify in incognito: privacy policy URL above

## Updating the policy

1. Edit `website/privacy-policy.html` (and CSS if needed)
2. Update **Last updated** date
3. Push to `main` — workflow redeploys automatically

## Do not use

A separate `deploy-privacy-pages` workflow was removed because it overwrote the full website with only three files, breaking the live site.
