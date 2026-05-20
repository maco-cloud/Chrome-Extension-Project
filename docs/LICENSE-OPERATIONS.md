# QuickDigest AI — License Operations

Operational guide for selling and supporting Lifetime Pro licenses.

---

## Pricing

| Product | Price | Billing |
|---------|-------|---------|
| Lifetime Pro | **$14.99 USD** | One-time (Stripe Payment Link) |

Checkout URL: `https://buy.stripe.com/8x228r7M6cy3emAddw3VC03` (`src/config/billing.js` → `CHECKOUT_LIFETIME_URL`)

---

## Issuing license keys

### Generate keys

```bash
node scripts/generate-license-key.js
# Multiple keys:
node scripts/generate-license-key.js 5
```

Format: `QD-AB12-CD34-EF56-GH78` (uppercase, no ambiguous characters).

### After each sale

1. Confirm payment in Stripe Dashboard (Customers → Payments).
2. Copy customer email from receipt.
3. Generate one unique key (never reuse keys).
4. Email the customer:

   **Subject:** Your QuickDigest AI Lifetime Pro license key

   **Body (template):**
   - Thank you for purchasing Lifetime Pro ($14.99 one-time).
   - License key: `QD-XXXX-XXXX-XXXX-XXXX`
   - Steps: Install extension → Unlock Pro → Enter license key → Activate.
   - Support: reply to this email or `maco70090@gmail.com`.

5. Log the key in your private spreadsheet: `key | email | date | stripe_payment_id | status`.

---

## Customer activation flow

1. User installs extension from Chrome Web Store.
2. User clicks **Unlock Lifetime Pro** → Stripe checkout.
3. User receives email with key.
4. User opens **Enter license key** and pastes key.
5. Pro unlocks on **that Chrome profile** (device-bound locally).

---

## Revoking a key

**Current (format validation):** Keys matching pattern are accepted until you maintain a deny list manually.

**Recommended (when API is live):**

1. Set `BILLING.LICENSE_API_URL` in `src/config/billing.js`.
2. Mark key `revoked` in your database.
3. Validation endpoint returns `expired` / invalid.

**Interim:** Ask customer to remove license in Settings → Remove license; issue a **new** key only after verifying purchase (refund/chargeback policy).

---

## Replacing a lost key

1. Look up Stripe payment by customer email.
2. Confirm purchase date and amount ($14.99).
3. If original key was never activated, resend the same key.
4. If activated on wrong machine, generate a **new** key and revoke/disable the old one in your records.
5. Optional: one free replacement per customer; document in spreadsheet.

---

## Refunds

1. Process refund in Stripe.
2. Revoke / note key as `refunded` in your log.
3. Customer can remove license locally; format-only validation will not auto-revoke until API is connected.
4. Reply with confirmation and that Pro access will end after they remove the license or when server validation is enabled.

---

## Support scripts

| Issue | Response |
|-------|----------|
| “No email with key” | Check spam; resend from Stripe receipt email; verify payment succeeded. |
| “Key invalid” | Confirm full key, no spaces; format `QD-XXXX-XXXX-XXXX-XXXX`. |
| “Too many attempts” | Wait 1 minute; check for typos. |
| “Paid but still Free” | Settings → paste key → Activate Lifetime Pro. |
| “New computer” | One license per device profile; offer transfer per policy. |

---

## Future: Stripe webhook → auto-issue

1. Stripe `checkout.session.completed` webhook.
2. Server generates key via same algorithm as `scripts/generate-license-key.js`.
3. Send email automatically (SendGrid, Resend, etc.).
4. Set `LICENSE_API_URL` for validation + device fingerprint (`deviceFingerprint` in POST body).

Architecture is prepared in `license-validator.js` and `device-id.js`.

---

## Security notes

- Never commit real keys or Stripe secret keys to git.
- Never expose demo keys in production UI (`IS_DEV_BUILD` must be `false`).
- Payment Link is public; security is **unique keys** + optional server validation.
