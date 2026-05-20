# Testing Guide

## Health check

```bash
curl https://YOUR-WORKER.workers.dev/health
```

Expected: `{"ok":true,"service":"quickdigest-license-api",...}`

## Resend / email debugging (tail logs)

```bash
cd worker
npx wrangler tail --format pretty
```

Trigger a test checkout, then watch for:

- `[quickdigest-email] License email sent successfully` — OK (includes `httpStatus`, `resendEmailId`, `recipient`)
- `[quickdigest-email] Resend rejection:` — HTTP status + Resend `message`/`name` + body preview (no secrets)
- `[quickdigest-email] Missing or invalid RESEND_API_KEY` — set the secret

## Validate license (manual)

After a test purchase or KV entry:

```bash
curl -X POST https://YOUR-WORKER.workers.dev/validate-license \
  -H "Content-Type: application/json" \
  -d '{"key":"QD-XXXX-XXXX-XXXX-XXXX","deviceFingerprint":"test-device-1"}'
```

Valid key: `"valid":true`  
Invalid key: `"valid":false`  
Revoked key: `"revoked":true`

## Stripe test checkout

1. `USE_TEST_CHECKOUT: true` in extension `billing.js`.
2. Pay with `4242 4242 4242 4242`.
3. Check email for license key.
4. Activate in extension.

## Revoke license (admin)

```bash
curl -X POST https://YOUR-WORKER.workers.dev/revoke-license \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REVOKE_SECRET" \
  -d '{"key":"QD-XXXX-XXXX-XXXX-XXXX","reason":"refund"}'
```

Extension should lose Pro on next validation (or immediately if popup refreshes entitlements).

## Extension offline grace

1. Activate Pro with valid key (online).
2. Block Worker URL in firewall or set invalid `LICENSE_API_URL` temporarily.
3. Reopen popup within 7 days → Pro should remain (offline grace).
4. After grace period or revoked key → Pro removed.

## Browser persistence

1. Activate Pro.
2. Close and reopen popup → still Pro.
3. Restart Chrome → still Pro.

## Rate limiting

Send 31+ validate requests in one minute from same IP → `429 Too many requests`.
