# maco-crafts.gg website

Static brand site for Maco Crafts and QuickDigest AI.

**New?** Read **[GET-STARTED.md](GET-STARTED.md)** first — especially if you only added the domain in Search Console but have not purchased it yet.

## Recommended: GitHub Pages (free, always on)

Use **GitHub Pages** for this project. You do **not** need your PC running after you push changes.

| | GitHub Pages (use this) | Your PC / local server |
|--|---------------------------|-------------------------|
| Cost | Free | Free but useless when PC is off |
| Uptime | 24/7 on GitHub’s servers | Only while your computer is on |
| HTTPS | Automatic | You’d configure yourself |
| Updates from PC | Edit files → `git push` (or GitHub website editor) | Must keep a server running |

**Manage from your PC (pick one):**

1. **Cursor / VS Code** — edit files in `website/`, commit, push to `main`. GitHub deploys automatically.
2. **GitHub Desktop** — [desktop.github.com](https://desktop.github.com) if you prefer buttons instead of terminal.
3. **Browser only** — on github.com, open `website/index.html` → pencil icon → edit → Commit. No local git required.

Cloudflare Pages is also free and always-on; this repo is already set up for **GitHub Pages** (workflow + `CNAME`). Stick with that unless you later move DNS entirely to Cloudflare.

### Quick checklist (~15 minutes, one time)

1. [ ] Push this repo to GitHub (`maco-cloud/Chrome-Extension-Project`).
2. [ ] GitHub → **Settings** → **Pages** → source **GitHub Actions** → run **Deploy website** workflow.
3. [ ] At your domain registrar: add Google **TXT** (Search Console) + GitHub **A** records (section 3 below).
4. [ ] GitHub → **Pages** → **Custom domain** → `maco-crafts.gg` → wait for DNS check + HTTPS.
5. [ ] Search Console → Verify → submit `https://maco-crafts.gg/sitemap.xml`.

**Live URLs (after DNS is configured):**

- https://maco-crafts.gg/
- https://maco-crafts.gg/quickdigest.html
- https://maco-crafts.gg/privacy.html

---

## 1. Google Search Console — DNS TXT verification

Add this record at your domain registrar or DNS host **before** or **after** pointing the site at GitHub Pages.

| Field | Value |
|-------|--------|
| Type | `TXT` |
| Host / name | `@` (root). Some panels use blank or `maco-crafts.gg` |
| Value | `google-site-verification=Ko3PbH_t3Fzn4iOYe6fA5AvS9QmRWvAJQyqYl7uGGCo` |
| TTL | Default |

Then open [Google Search Console](https://search.google.com/search-console) → property type **Domain** → `maco-crafts.gg` → **Verify**.

Check propagation (PowerShell):

```powershell
nslookup -type=TXT maco-crafts.gg
```

DNS can take 5–60 minutes (sometimes up to 48 hours).

### Find your DNS provider

1. Check the email from when you purchased `maco-crafts.gg`.
2. Run [ICANN WHOIS lookup](https://lookup.icann.org/en/lookup?name=maco-crafts.gg) — the **Registrar** is where you log in. If nameservers point to Cloudflare or another host, add records there instead.

---

## 2. Deploy on GitHub Pages

1. Push this repo to `github.com/maco-cloud/Chrome-Extension-Project` (or your fork).
2. On GitHub: **Settings** → **Pages** → **Build and deployment**:
   - Source: **GitHub Actions**
3. Push to `main` (or run the **Deploy website** workflow manually). The workflow is [`.github/workflows/deploy-website.yml`](../.github/workflows/deploy-website.yml).
4. **Settings** → **Pages** → **Custom domain**: enter `maco-crafts.gg` and enable **Enforce HTTPS** when available.

The file [`CNAME`](CNAME) in this folder tells GitHub Pages to serve the custom domain.

---

## 3. DNS records for GitHub Pages hosting

Add these at the same DNS panel where you added the Google TXT record.

### Apex domain (`maco-crafts.gg`)

| Type | Host | Value |
|------|------|--------|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |

(GitHub may show different IPs in Pages settings — use those if they differ.)

### `www` subdomain (optional)

| Type | Host | Value |
|------|------|--------|
| `CNAME` | `www` | `maco-cloud.github.io` |

Replace with your GitHub username/org if the repo is under a different account. For org `maco-cloud` and project site from this repo, the Pages URL is typically `https://maco-cloud.github.io/Chrome-Extension-Project/` until the custom domain is active; the **CNAME** file maps the apex to `maco-crafts.gg`.

### IPv6 (optional)

| Type | Host | Value |
|------|------|--------|
| `AAAA` | `@` | `2606:50c0:8000::153` |
| `AAAA` | `@` | `2606:50c0:8001::153` |
| `AAAA` | `@` | `2606:50c0:8002::153` |
| `AAAA` | `@` | `2606:50c0:8003::153` |

After DNS propagates, confirm:

- https://maco-crafts.gg/ loads the home page
- https://maco-crafts.gg/privacy.html loads the privacy policy
- GitHub Pages shows **DNS check successful** and certificate **Active**

---

## 4. Search Console after go-live

1. Submit sitemap: `https://maco-crafts.gg/sitemap.xml`
2. Request indexing for `/` and `/privacy.html`

---

## Alternative: Cloudflare Pages

1. Connect the GitHub repo in Cloudflare **Pages**.
2. Build command: none. Output directory: `website`.
3. Add custom domains `maco-crafts.gg` and `www.maco-crafts.gg`.
4. Add the DNS records Cloudflare shows in its UI (do not guess).
5. Keep the Google **TXT** record at root for Search Console.

---

## Local preview

From the repo root:

```powershell
cd website
python -m http.server 8080
```

Open http://localhost:8080/
