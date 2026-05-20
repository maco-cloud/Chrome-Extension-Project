import { KV_PREFIX } from "../utils/constants.js";

/**
 * Simple fixed-window rate limit per IP + route.
 * @returns {Promise<{ allowed: boolean, retryAfter?: number }>}
 */
export async function checkRateLimit(kv, ip, route, maxRequests, windowSec) {
  const window = Math.floor(Date.now() / 1000 / windowSec);
  const key = `${KV_PREFIX.RATE}${route}:${ip}:${window}`;

  const current = Number((await kv.get(key)) || 0);
  if (current >= maxRequests) {
    return { allowed: false, retryAfter: windowSec };
  }

  await kv.put(key, String(current + 1), { expirationTtl: windowSec * 2 });
  return { allowed: true };
}
