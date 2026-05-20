# QuickDigest AI — Payment & License Testing

End-to-end guide for validating monetization before Chrome Web Store launch.

Load the extension from the **repository root** (folder containing `manifest.json`).

---

## 1. Free user flow

1. Install / reload unpacked extension.
2. Open popup — confirm **Free** plan bar and **5 summaries left today**.
3. Summarize a normal article — should succeed.
4. Repeat until daily limit — confirm friendly upgrade prompt (mentions **$14.99** one-time).
5. Confirm only **Quick**, **Bullets**, **Key Takeaways** modes are selectable; others show **Pro** lock.
6. Save summaries until history shows **3/3** — confirm history locked message.
7. Confirm **Export**, **Copy all**, **Copy Markdown** show lock / upgrade prompt.

---

## 2. Stripe checkout flow

### Stripe test mode setup

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com).
2. Enable **Test mode** (toggle top-right).
3. In `src/config/billing.js`, set `USE_TEST_CHECKOUT: true` (uses test link automatically).
4. Test link: `https://buy.stripe.com/test_4gM5kD5vDgvwfzFdG06wE02` (`CHECKOUT_LIFETIME_TEST_URL`).
5. Confirm price displays **$14.99 USD** on the Stripe page.

### Test checkout

1. In extension popup, click **Unlock Pro** → **Unlock Lifetime Pro** ($14.99).
2. Confirm button shows **Opening secure checkout…** and cannot double-click spam.
3. Stripe tab opens; complete payment with test card:

   | Field | Value |
   |-------|--------|
   | Card | `4242 4242 4242 4242` |
   | Expiry | Any future date |
   | CVC | Any 3 digits |
   | ZIP | Any valid ZIP |

4. Confirm success page in Stripe.
5. Extension should open **Activate Lifetime Pro** modal with instructions.

### After payment (automated)

With the Cloudflare Worker deployed (`worker/` — see `worker/DEPLOYMENT.md`):

1. Stripe webhook issues the key and emails it via Resend automatically.
2. Check Resend logs and customer inbox.
3. Paste key in extension → **Activate Lifetime Pro**.

**Without Worker deployed**, issue keys manually:

```bash
node scripts/generate-license-key.js
```

---

## 3. License activation

1. Open **Enter license key** (from upgrade modal or history lock).
2. Confirm hint explains where to find the key (purchase email).
3. Paste valid key `QD-XXXX-XXXX-XXXX-XXXX` format.
4. Confirm **Verifying…** state, then **Lifetime Pro unlocked** celebration.
5. Confirm plan bar → **Pro · Lifetime**, unlimited usage.
6. All 9 modes unlocked; export buttons active.
7. Wrong key → *“That license key could not be verified. Please check the key and try again.”*
8. No stack traces or API errors visible.

---

## 4. Invalid / throttled activation

1. Enter `QD-TEST-INVALID-KEY1` repeatedly.
2. After several failures, confirm **cooldown** message (5 seconds between tries).
3. After **5 failures in 15 minutes**, confirm **one-minute lockout** message.
4. Wait for lockout to clear; valid key should still activate.

---

## 5. Expired license (dev build only)

With `IS_DEV_BUILD = true` in `src/config/build.js`, dev-only expired key can be tested locally. **Never ship with `IS_DEV_BUILD = true`.**

Production: revoke by removing key from your issued-keys list or via future API.

---

## 6. Persistence

1. Activate Pro with a valid key.
2. Close popup and reopen — still Pro.
3. Restart Chrome — still Pro.
4. Reload extension — still Pro (license in `chrome.storage.local`).

---

## 7. Offline behavior

1. Activate Pro while online (format validation).
2. Disable network (Chrome DevTools → Network → Offline).
3. Reload popup — Pro should remain active (offline grace).
4. New activation while offline may fail with friendly network message.

---

## 8. Device binding (lightweight)

1. Activate on profile A.
2. Export `chrome.storage.local` is not required — instead note `deviceId` is stored with license.
3. If you simulate a new install (new extension ID / fresh profile), re-activation with same key may show **transfer warning** toast once.

---

## 9. Fallback & non-payment flows

- Summarize with Chrome AI unavailable → local fallback, no crash.
- Keyboard shortcuts `Ctrl+Shift+S` / `Ctrl+Shift+Y` still work for free users within limits.

---

## 10. Pre-submit checklist

- [ ] `USE_TEST_CHECKOUT` is `false` in `src/config/billing.js`
- [ ] `IS_DEV_BUILD` is `false`
- [ ] No demo keys in UI
- [ ] Stripe live Payment Link price = **$14.99**
- [ ] `manifest.json` version matches `EXTENSION_VERSION` in `constants.js`
- [ ] Run `.\scripts\build-store-zip.ps1` and spot-check zip contents
- [ ] Complete `docs/LAUNCH-QA.md`

---

## 11. Live production smoke test (before Chrome Web Store submit)

**Prerequisites:** Worker deployed, Stripe **live** webhook configured, `USE_TEST_CHECKOUT: false`, `IS_DEV_BUILD: false`.

1. Reload unpacked extension from repo root.
2. **Unlock Lifetime Pro** → Stripe opens `https://buy.stripe.com/8x228r7M6cy3emAddw3VC03` (not a `test_` URL).
3. Complete one real **$14.99** payment (refund in Stripe Dashboard afterward if desired).
4. Stripe Dashboard → Webhooks → live endpoint → delivery **200** for `checkout.session.completed`.
5. Customer email receives license key (check Resend logs if delayed).
6. Paste key → Pro unlocks; restart Chrome → still Pro.
7. Optional: `curl https://quickdigest-license-api.maco70090.workers.dev/health` → `{"ok":true,...}`

---

## Support email

Customer support: `maco70090@gmail.com` (also in `BILLING.SUPPORT_EMAIL`).
