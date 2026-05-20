# Deploy & Sync Validation Checklist

Last audit: run before every production release.

## 1. Git sync

| Check | Command |
|-------|---------|
| Uncommitted monetization files | `git status` |
| Worker tracked | `git ls-files worker/index.js` |
| billing.js tracked | `git ls-files src/config/billing.js` |

**Critical:** `worker/` and `src/config/billing.js` must be committed. They were untracked in initial monetization work.

## 2. billing.js

```js
LICENSE_API_URL: "https://quickdigest-license-api.maco70090.workers.dev"
LICENSE_PROVIDER: "api"
USE_TEST_CHECKOUT: false  // true only for local Stripe test-mode QA
```

Reload extension after any change.

## 3. Worker deployed

```bash
curl https://quickdigest-license-api.maco70090.workers.dev/health
# Expect: {"ok":true,"service":"quickdigest-license-api",...}
```

Redeploy after code changes:

Structured payment logs: `worker/utils/logger.js` — masked emails, no secrets. Tail with `npx wrangler tail`.

```bash
cd worker
npx wrangler deploy
```

## 4. Secrets (Cloudflare)

```bash
cd worker
npx wrangler secret list
```

Required:

- `STRIPE_WEBHOOK_SECRET` — must match **test** or **live** mode in Stripe Dashboard
- `RESEND_API_KEY`
- `REVOKE_SECRET`

## 5. Stripe webhook

- URL: `https://quickdigest-license-api.maco70090.workers.dev/stripe-webhook`
- Event: `checkout.session.completed`
- **Test purchases** → webhook endpoint must be created in **Test mode** with test signing secret

Check delivery: Stripe Dashboard → Developers → Webhooks → your endpoint → Recent deliveries

## 6. Resend email

- `FROM_EMAIL` in wrangler.toml (default `onboarding@resend.dev` for testing)
- With `onboarding@resend.dev`, Resend only delivers to **your verified account email** unless you verify a custom domain
- Check Resend Dashboard → Logs for bounces/API errors

## 7. Why no email? (troubleshooting)

| Cause | Fix |
|-------|-----|
| Webhook not configured | Add endpoint in Stripe (correct test/live mode) |
| Wrong webhook secret | `wrangler secret put STRIPE_WEBHOOK_SECRET` |
| Worker not deployed | `wrangler deploy` |
| No `RESEND_API_KEY` | `wrangler secret put RESEND_API_KEY` |
| Resend sandbox restriction | Verify domain or check Resend logs |
| Payment link mode ≠ webhook mode | Test link + test webhook, or live + live |
| Email failed but license created | Check KV `email_pending:*` via wrangler |

List pending emails:

```bash
cd worker
npx wrangler kv key list --binding=LICENSES --prefix="email_pending:"
```

## 8. End-to-end test

### Test mode (pre-launch QA)

1. `USE_TEST_CHECKOUT: true` in `billing.js`, reload extension
2. Pay with Stripe test card `4242 4242 4242 4242`
3. Stripe **test** webhook shows **200** success
4. Email arrives (or check Resend logs)
5. Activate key in extension → Pro unlocks
6. Set `USE_TEST_CHECKOUT: false` before store submit

### Live mode (production launch)

1. `USE_TEST_CHECKOUT: false` — checkout opens `CHECKOUT_LIFETIME_URL` (live Payment Link)
2. Stripe **live** webhook endpoint → same Worker URL with **live** signing secret
3. Complete one real $14.99 purchase (refund in Dashboard if needed)
4. Confirm webhook **200**, license email, activation, Pro unlock, persistence after browser restart
5. Extension `LICENSE_API_URL`: `https://quickdigest-license-api.maco70090.workers.dev`
