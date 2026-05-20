# QuickDigest AI — Monetization (v2.6)

**Model:** Free tier + **one-time Lifetime Pro** license (no subscriptions).

## Plans

| Feature | Free | Lifetime Pro |
|--------|------|----------------|
| Summaries / day | 5 | Unlimited |
| Summary modes | Quick, Bullets, Key Takeaways | All 9 modes |
| Saved history | Up to 3 items | Unlimited (50 cap) |
| Export / Copy all / Copy Markdown | Locked | Unlocked |

## Summary modes

Each mode uses a dedicated prompt profile and local synthesis pipeline so outputs differ in structure, tone, and format.

| Mode | Tier |
|------|------|
| Quick Summary | Free |
| Bullet Points | Free |
| Key Takeaways | Free |
| Study Notes | Pro |
| Executive Brief | Pro |
| Action Items | Pro |
| Beginner Explanation | Pro |
| Detailed Analysis | Pro |
| Social Media Thread | Pro |

Architecture:

- `src/config/summary-prompts.js` — prompts + catalog
- `src/utils/content-extract.js` — sentence pools
- `src/utils/mode-synthesizer.js` — per-mode output builders
- Chrome AI prepends mode instructions, then reshapes via synthesizer; falls back to local silently

## License keys

1. User buys **Lifetime Pro ($14.99 USD)** on Stripe: `https://buy.stripe.com/8x228r7M6cy3emAddw3VC03`
2. You email a license key in format `QD-XXXX-XXXX-XXXX-XXXX` (generate with `node scripts/generate-license-key.js`) — **always explain this in the receipt email**
3. User: **Unlock Lifetime Pro → checkout → check email → Enter license key** or **Settings → Activate license**

Storage: `chrome.storage.local` → `license`

## Automated delivery (production)

Deploy the Cloudflare Worker in `/worker`:

- Stripe webhook → generate key → KV → Resend email
- Extension validates via `LICENSE_API_URL`

See `worker/DEPLOYMENT.md` and `docs/LICENSE-API.md`.

Set in `src/config/billing.js`:

```js
LICENSE_API_URL: "https://quickdigest-license-api.<account>.workers.dev",
LICENSE_PROVIDER: "api",
```
