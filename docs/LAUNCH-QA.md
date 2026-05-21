# QuickDigest AI — Launch QA (internal)

Run before every Chrome Web Store submission. Load the extension from the **repository root** (where `manifest.json` lives), not `dist/`.

**Payment & license:** Complete `docs/PAYMENT-TESTING.md` end-to-end before submit.

## Security & monetization

- [ ] No demo license keys in UI, placeholders, tooltips, README, or docs
- [ ] No “Developer Pro” toggle in options or popup
- [ ] `IS_DEV_BUILD` is `false` in `src/config/build.js`
- [ ] `USE_TEST_CHECKOUT` is `false` in `src/config/billing.js` (live Payment Link only)
- [ ] `CHECKOUT_LIFETIME_TEST_URL` is **not** referenced in UI (test link dev-only)
- [ ] `LICENSE_API_URL` is `https://quickdigest-license-api.maco70090.workers.dev`
- [ ] Lifetime checkout URL opens **live** Stripe payment link (not `buy.stripe.com/test_*`)
- [ ] Invalid / expired keys show friendly messages only
- [ ] Activation cooldown prevents rapid retries (5s)

## Free vs Pro

- [ ] Free: 5 summaries/day, 3 history slots, 3 modes (Quick, Bullets, Key Takeaways)
- [ ] Pro locked modes show upgrade prompt
- [ ] Pro: unlimited summaries, all 9 modes, export, copy all, copy markdown, history search
- [ ] License activation from popup and options

## Summary modes (distinct output)

Test on: news article, blog, Wikipedia, Reddit thread, long doc, short page, YouTube (if captions).

| Mode | Expect |
|------|--------|
| Quick Summary | Short paragraph overview |
| Bullet Points | Bullets only, minimal prose |
| Key Takeaways | Numbered insights |
| Study Notes | Headings / sections |
| Executive Brief | BLUF + findings |
| Action Items | Checklist tasks |
| Beginner Explanation | Plain language |
| Detailed Analysis | Longer reasoning |
| Social Media Thread | `1/`, `2/`, … posts |

- [ ] No empty summary cards
- [ ] No duplicate output across modes on same page
- [ ] Markdown-like text renders (pre-wrap where needed)

## Chrome AI fallback

- [ ] With AI unavailable: popup never crashes
- [ ] No stack traces or `runtime.lastError` shown to user
- [ ] Engine chip shows “Local processing” when fallback used
- [ ] Options shows calm on-device AI status

## UX

- [ ] First open: onboarding overlay; dismiss persists
- [ ] Regenerate re-runs last summarize action
- [ ] Copy Markdown (Pro) copies structured markdown
- [ ] Loading banner + skeleton during summarize
- [ ] Keyboard shortcuts work (`Ctrl+Shift+S`, `Ctrl+Shift+Y`)

## Store readiness

- [ ] Manifest V3, version matches `constants.js`
- [ ] Permissions: `storage`, `activeTab`, `scripting`, `offscreen`, `contextMenus` only
- [ ] No remote code execution
- [ ] Privacy policy URL live: `https://maco-cloud.github.io/Chrome-Extension-Project/privacy-policy.html`
- [ ] Icons 16/48/128 present

## Build

```powershell
.\scripts\build-store-zip.ps1
```

Verify zip contents: no `node_modules`, no `.env`, no dev keys.
