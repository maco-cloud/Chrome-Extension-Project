# Stripe Webhook Setup

## Test mode (recommended first)

1. Stripe Dashboard → enable **Test mode** (top right).
2. Developers → **Webhooks** → **Add endpoint**.
3. Endpoint URL:

   ```
   https://YOUR-WORKER.workers.dev/stripe-webhook
   ```

4. Select event: **`checkout.session.completed`**
5. Add endpoint → reveal **Signing secret** (`whsec_...`).
6. Set secret on Worker:

   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

7. Use your **test** Payment Link in the extension (`USE_TEST_CHECKOUT: true`).

## Test a purchase

1. Complete checkout with card `4242 4242 4242 4242`.
2. Stripe → Webhooks → your endpoint → check **Succeeded** delivery.
3. Customer email should receive license key (Resend dashboard → Logs).
4. Paste key in extension → Activate.

## Stripe CLI (local debugging)

```bash
stripe listen --forward-to http://localhost:8787/stripe-webhook
```

Use the CLI `whsec_...` secret in `.dev.vars` when running `wrangler dev`.

## Live mode

1. Turn off Test mode in Stripe.
2. Create a **live** webhook with the same URL and event.
3. Update `STRIPE_WEBHOOK_SECRET` with the **live** signing secret:

   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

4. Set `USE_TEST_CHECKOUT: false` and use live Payment Link in `billing.js`.

## Idempotency

The Worker stores processed Stripe event IDs in KV for 30 days. Duplicate deliveries return `{ ok: true, duplicate: true }` without issuing a second key.
