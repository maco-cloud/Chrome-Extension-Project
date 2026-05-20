# QuickDigest AI — License API (Cloudflare Worker)

Serverless license delivery and validation:

- **Stripe webhook** → generate key → store in KV → email via Resend
- **Extension** → `POST /validate-license` → unlock Pro

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/stripe-webhook` | Stripe `checkout.session.completed` |
| POST | `/validate-license` | Extension license validation |
| POST | `/revoke-license` | Admin revoke (requires secret) |

## Quick start

```bash
cd worker
npm install
wrangler login
wrangler kv namespace create LICENSES
# Update wrangler.toml with KV id
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put REVOKE_SECRET
wrangler deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup.

## Extension config

After deploy, set in `src/config/billing.js`:

```js
LICENSE_PROVIDER: "api",
LICENSE_API_URL: "https://quickdigest-license-api.<your-subdomain>.workers.dev",
```
