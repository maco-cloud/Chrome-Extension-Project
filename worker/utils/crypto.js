import { CHARSET } from "./constants.js";

export function generateLicenseKey() {
  const blocks = [];
  for (let b = 0; b < 4; b += 1) {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    let block = "";
    for (const byte of bytes) {
      block += CHARSET[byte % CHARSET.length];
    }
    blocks.push(block);
  }
  return `QD-${blocks.join("-")}`;
}

/**
 * Verify Stripe-Signature header (t=timestamp,v1=signature).
 * @param {string} payload Raw request body
 * @param {string} signatureHeader Stripe-Signature header value
 * @param {string} secret Webhook signing secret
 */
export async function verifyStripeWebhook(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    return false;
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
