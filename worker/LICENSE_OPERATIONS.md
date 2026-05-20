# License Operations

## Automatic flow (production)

1. Customer pays on Stripe Payment Link.
2. Stripe sends `checkout.session.completed` to `/stripe-webhook`.
3. Worker generates `QD-XXXX-XXXX-XXXX-XXXX`, saves to KV, emails customer via Resend.
4. Customer pastes key in extension → `/validate-license` → Pro unlocked.

## Manual revoke (refund / abuse)

```bash
curl -X POST https://YOUR-WORKER.workers.dev/revoke-license \
  -H "Authorization: Bearer $REVOKE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"key":"QD-....","reason":"refund"}'
```

## Manual issue (support exception)

Use only if webhook/email failed:

```bash
# From project root
node scripts/generate-license-key.js
```

Then insert via Wrangler (optional) or rely on validate if you add key to KV:

```bash
npx wrangler kv key put --binding=LICENSES "license:QD-...." '{"licenseKey":"QD-....","email":"user@example.com","plan":"lifetime","revoked":false,"purchasedAt":1730000000000,"activationCount":0,"deviceFingerprints":[]}'
```

Prefer re-sending webhook from Stripe Dashboard if possible.

## Re-send email

If `email_pending:*` exists in KV, resend manually from Resend dashboard with the key from KV:

```bash
npx wrangler kv key get --binding=LICENSES "license:QD-...."
```

## Device limit

Default: **3** device fingerprints per license (`MAX_ACTIVATIONS_PER_LICENSE` in `wrangler.toml`).

## Support template

> Your Lifetime Pro license key is: **QD-XXXX-XXXX-XXXX-XXXX**  
> Open QuickDigest AI → Unlock Lifetime Pro → Enter license key → Activate.  
> One-time purchase, no subscription. Support: maco70090@gmail.com
