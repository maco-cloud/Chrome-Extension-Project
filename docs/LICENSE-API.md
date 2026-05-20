# License API (Cloudflare Worker)

Automated license delivery lives in the `/worker` directory.

## Flow

1. Stripe `checkout.session.completed` → Worker webhook
2. Worker generates key, stores in KV, emails via Resend
3. Extension calls `POST /validate-license` → Pro unlock

## Deploy

See [worker/DEPLOYMENT.md](../worker/DEPLOYMENT.md).

## Extension configuration

After deploy, set in `src/config/billing.js`:

```js
LICENSE_API_URL: "https://quickdigest-license-api.YOUR_ACCOUNT.workers.dev",
LICENSE_PROVIDER: "api",
```

Reload the extension.

## Testing

See [worker/TESTING.md](../worker/TESTING.md) and [docs/PAYMENT-TESTING.md](./PAYMENT-TESTING.md).
