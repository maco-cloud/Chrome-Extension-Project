# Backend API (AI Reply Anywhere)

The extension never calls OpenAI/Anthropic directly. Implement these endpoints on your server.

## Environment

Set in extension `.env`:

```
VITE_API_BASE_URL=https://your-api.com/v1
```

Client calls `{VITE_API_BASE_URL}/generate` and `{VITE_API_BASE_URL}/analytics`.

## POST /generate

**Headers:** `Authorization: Bearer <userId or JWT>`

**Body:**

```json
{
  "tone": "professional",
  "context": "thread or conversation text",
  "draft": "user's current draft",
  "siteHost": "mail.google.com",
  "customPrompt": "optional premium style hint",
  "maxTokens": 512,
  "includeSignature": true
}
```

**Response (200):**

```json
{
  "text": "Generated reply text",
  "tone": "professional",
  "remaining": 12
}
```

**Errors:**

| Status | Meaning |
|--------|---------|
| 402 | Premium required (locked tone) |
| 429 | Rate limit |
| 401 | Invalid token |

## POST /analytics

Fire-and-forget event beacon. Body includes `event`, `tone`, `siteHost`, `ts`.

## Stripe webhooks (server)

On `checkout.session.completed` or `customer.subscription.updated`:

1. Resolve `client_reference_id` or metadata → user id
2. Update user record: `plan: premium`, `status: active`
3. Extension syncs via periodic `GET /me` or push to `chrome.storage` (future)

Until webhooks are live, use **mock Premium** in popup/options for QA.

## Security

- Store provider API keys only on server
- Rate limit per user id + IP
- Validate JWT from Supabase (or your auth)
- Never return raw provider errors to clients
