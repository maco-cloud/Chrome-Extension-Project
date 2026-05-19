# Get maco-crafts.gg live (start here)

## Important: Search Console is not buying the domain

Adding `maco-crafts.gg` in **Google Search Console** only tells Google you *want* to verify that name. You still must **register (purchase)** the domain from a registrar. Until you do, nobody owns it, DNS does not exist, and verification will fail.

---

## Step 0 — Register the domain (~$25–70/year for `.gg`)

Pick one registrar (all work with GitHub Pages):

| Registrar | Why people use it |
|-----------|-------------------|
| [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) | At-cost pricing, great DNS + optional free CDN |
| [Porkbun](https://porkbun.com) | Simple UI, often cheap `.gg` |
| [Namecheap](https://www.namecheap.com) | Familiar, easy DNS panel |

1. Create an account.
2. Search for **maco-crafts.gg**.
3. If **available** → add to cart and complete checkout.
4. If **taken** → pick another name (e.g. `macocrafts.gg`, `maco-crafts.com`) and update `website/CNAME` + docs to match.

After purchase, DNS is managed in that registrar’s dashboard (or Cloudflare if you transfer DNS there).

---

## Step 1 — Put the website on GitHub (free, PC can be off)

Your site files are already in the `website/` folder. Upload the repo to GitHub once:

### Option A — GitHub website (no git on PC)

1. Open https://github.com/new (or your `maco-cloud` org).
2. Repository name: `Chrome-Extension-Project` (or use existing repo).
3. Upload the whole project (drag folders) **or** upload only changed files under `website/` and `.github/workflows/`.
4. **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**.
5. **Actions** tab → run workflow **Deploy website** (or push any commit to `main`).

### Option B — GitHub Desktop on your PC

1. Install https://desktop.github.com
2. **File** → **Add local repository** → select this project folder.
3. Commit message: `Add maco-crafts.gg website`
4. **Push origin**

Site will be at `https://<user>.github.io/<repo>/` until custom domain DNS is set.

---

## Step 2 — DNS at your registrar (after you own the domain)

Log into the place you **bought** `maco-crafts.gg`.

### A) Google Search Console verification

| Type | Host | Value |
|------|------|--------|
| TXT | `@` | `google-site-verification=Ko3PbH_t3Fzn4iOYe6fA5AvS9QmRWvAJQyqYl7uGGCo` |

Then Search Console → **Verify**.

### B) Point domain at GitHub Pages

| Type | Host | Value |
|------|------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `maco-cloud.github.io` |

(Use your GitHub username/org if not `maco-cloud`.)

### C) GitHub custom domain

**Settings** → **Pages** → **Custom domain** → `maco-crafts.gg` → save → enable **Enforce HTTPS** when offered.

Wait 15 minutes–48 hours for DNS. Test:

- https://maco-crafts.gg/
- https://maco-crafts.gg/privacy.html

---

## Step 3 — Search Console (after site loads)

1. Verify domain (TXT record).
2. Submit sitemap: `https://maco-crafts.gg/sitemap.xml`

---

## What runs without your PC

| Service | Role |
|---------|------|
| **Registrar** | You own the domain name |
| **GitHub Pages** | Hosts the website 24/7 |
| **Google Search Console** | Search indexing / verification |

Your PC is only for editing files and uploading to GitHub.

---

## Need a free site *before* you buy the domain?

Use GitHub’s default URL (`https://maco-cloud.github.io/Chrome-Extension-Project/`) for the Chrome Web Store privacy link until `maco-crafts.gg` is registered and DNS is live. Then switch the store listing to `https://maco-crafts.gg/privacy.html`.

More detail: [README.md](README.md)
