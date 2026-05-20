# AI Reply Anywhere

SaaS-style Chrome extension: AI reply & rewrite on Gmail, LinkedIn, Slack, X, Reddit, dating apps, and any textarea. **No user API keys** — all AI traffic goes through your backend.

## Stack

- Manifest V3 + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion + Lucide
- Stripe-ready billing (Checkout URLs via env)
- Mock auth + mock Premium for development

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist` folder (created after first `npm run dev` or `npm run build`)

## Production build

```bash
npm run build
npm run zip   # creates dist/ai-reply-anywhere-store.zip
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Your backend `/generate` + `/analytics` |
| `VITE_STRIPE_CHECKOUT_MONTHLY_URL` | Stripe Checkout session URL |
| `VITE_STRIPE_CHECKOUT_YEARLY_URL` | Annual plan checkout |
| `VITE_SUPABASE_URL` | Auth (wire when ready) |
| `VITE_SUPABASE_ANON_KEY` | Auth anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client-only Stripe key |

**Never** put OpenAI/Anthropic secret keys in the extension.

## Architecture

```
src/
├── background/service-worker.ts   # API, limits, billing messages
├── content/                       # MutationObserver + floating UI
├── popup/                         # Dashboard
├── options/                       # Settings
└── shared/
    ├── api/ai-client.ts           # Provider-agnostic backend client
    ├── entitlements/              # Free vs Premium gating
    ├── billing/stripe.ts          # Checkout helpers
    ├── analytics/                 # Local + beacon to API
    └── storage/                   # chrome.storage.local
```

## Backend contract

See **[docs/BACKEND.md](docs/BACKEND.md)** for `/generate`, `/analytics`, Stripe webhooks, and security notes.

Quick example — `POST {VITE_API_BASE_URL}/generate` with `Authorization: Bearer <userId>` and body `{ tone, context, draft, siteHost, customPrompt?, maxTokens? }`.

## Dev tools

- Popup → **Dev: Enable mock Premium**
- Options → **Enable mock Premium (dev)**

## Chrome Web Store

See [docs/STORE-LISTING.md](docs/STORE-LISTING.md) for descriptions, keywords, and screenshot plan.

## License

Proprietary — Maco Cloud / your entity.
