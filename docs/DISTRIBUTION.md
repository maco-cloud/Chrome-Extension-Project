# Distribution policy

QuickDigest AI is meant to be installed **only from the Chrome Web Store**, not by cloning or downloading this repository.

## What this repo is for

- Privacy policy and store listing text (public, for Google review)
- Support issues
- Optional: your own development (if you keep the repo private)

## Can you block free installs from GitHub?

**If this repository is public**, anyone can still clone or download ZIP. GitHub does not offer a “no download” mode for public repos. Removing install instructions from the README only stops *advertising* sideloading—it does not block technical access.

To actually restrict access to extension source:

### Recommended: private code + public policy

1. Create a small **public** repo (e.g. `maco-cloud/quickdigest-docs`) containing only:
   - `privacy-policy.md`
   - Optional `README.md` with store link and support info
2. Set **Chrome-Extension-Project** to **Private**  
   GitHub → **Settings** → **General** → **Danger zone** → **Change repository visibility** → **Private**
3. Use the **public** repo URL for the Chrome Web Store privacy policy, for example:  
   `https://github.com/maco-cloud/quickdigest-docs/blob/main/privacy-policy.md`
4. Keep using **GitHub Issues** on the public docs repo (or a dedicated support repo) for Support URL.

### Until you go private

- Do **not** publish `.crx` / `.zip` releases (already ignored in `.gitignore`)
- README does not document “Load unpacked” install steps
- Product website should link to the Chrome Web Store, not “install from GitHub”

## Chrome Web Store privacy URL (current)

https://github.com/maco-cloud/Chrome-Extension-Project/blob/main/docs/privacy-policy.md

After moving policy to a public docs-only repo, update the store listing to that URL and make this repo private.
