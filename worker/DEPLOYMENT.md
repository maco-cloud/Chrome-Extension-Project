# Deployment Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com) (free tier works)
- [Stripe account](https://stripe.com)
- [Resend account](https://resend.com) (free tier: 100 emails/day)

## 1. Install Wrangler

```bash
cd worker
npm install
npx wrangler login
```

## 2. Create KV namespace

```bash
npx wrangler kv namespace create LICENSES
npx wrangler kv namespace create LICENSES --preview
```

Copy the `id` values into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "LICENSES"
id = "xxxxxxxx"
preview_id = "yyyyyyyy"
```

## 3. Set secrets

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put REVOKE_SECRET
```

| Secret | Where to get it |
|--------|-----------------|
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret |
| `RESEND_API_KEY` | Resend → API Keys |
| `REVOKE_SECRET` | Generate a long random string (password manager) |

## 4. Configure email (Resend)

1. Add and verify your domain in Resend (or use `onboarding@resend.dev` for testing only).
2. Update `FROM_EMAIL` in `wrangler.toml` vars, e.g. `QuickDigest AI <licenses@yourdomain.com>`.

## 5. Deploy

```bash
npx wrangler deploy
```

Note your Worker URL, e.g. `https://quickdigest-license-api.your-account.workers.dev`

## 6. Stripe webhook

See [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md).

Endpoint URL:

```
https://quickdigest-license-api.your-account.workers.dev/stripe-webhook
```

Event: `checkout.session.completed`

## 7. Update Chrome extension

In `src/config/billing.js`:

```js
LICENSE_PROVIDER: "api",
LICENSE_API_URL: "https://quickdigest-license-api.your-account.workers.dev",
USE_TEST_CHECKOUT: false,  // production
```

Reload the extension in `chrome://extensions`.

## Optional: custom domain

Cloudflare Dashboard → Workers → your worker → Settings → Triggers → Custom Domain.

Use that URL as `LICENSE_API_URL`.
