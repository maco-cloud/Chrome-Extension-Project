import { generateLicenseKey, verifyStripeWebhook } from "../utils/crypto.js";
import { sanitizeEmail } from "../utils/sanitize.js";
import {
  createLicenseRecord,
  getLicense,
  isEventProcessed,
  markEventProcessed,
  saveLicense,
} from "../services/license-store.js";
import { sendLicenseEmail } from "../services/email.js";
import { json, errorResponse } from "../utils/response.js";

export async function handleStripeWebhook(request, env) {
  const signature = request.headers.get("Stripe-Signature");
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return errorResponse("Webhook not configured", 503);
  }

  const payload = await request.text();
  const valid = await verifyStripeWebhook(payload, signature, secret);
  if (!valid) {
    return errorResponse("Invalid signature", 400);
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return errorResponse("Invalid payload", 400);
  }

  if (await isEventProcessed(env.LICENSES, event.id)) {
    return json({ ok: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(env, event);
    }
    await markEventProcessed(env.LICENSES, event.id);
    return json({ ok: true, received: true });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error("[stripe-webhook] Processing failed:", msg);
    return errorResponse("Webhook processing failed", 500);
  }
}

async function handleCheckoutCompleted(env, event) {
  const session = event.data?.object;
  if (!session) {
    return;
  }

  if (session.payment_status && session.payment_status !== "paid") {
    return;
  }

  const email =
    sanitizeEmail(session.customer_details?.email) ||
    sanitizeEmail(session.customer_email);

  if (!email) {
    console.error("[stripe-webhook] NO_EMAIL: checkout session has no customer email");
    throw new Error("NO_EMAIL");
  }

  const existingBySession = session.id
    ? await env.LICENSES.get(`session:${session.id}`)
    : null;
  if (existingBySession) {
    const pendingRaw = await env.LICENSES.get(`email_pending:${existingBySession}`);
    if (pendingRaw) {
      let to = email;
      try {
        const pending = JSON.parse(pendingRaw);
        to = pending.email || to;
      } catch {
        to = pendingRaw;
      }
      console.log(
        `[stripe-webhook] Retrying pending email for session=${session.id} license=${existingBySession}`,
      );
      await sendLicenseEmail(env, {
        to,
        licenseKey: existingBySession,
      });
      await env.LICENSES.delete(`email_pending:${existingBySession}`);
    }
    return;
  }

  let licenseKey = generateLicenseKey();
  let attempts = 0;
  while ((await getLicense(env.LICENSES, licenseKey)) && attempts < 5) {
    licenseKey = generateLicenseKey();
    attempts += 1;
  }

  const record = createLicenseRecord({
    licenseKey,
    email,
    stripeSessionId: session.id,
    stripeEventId: event.id,
  });

  await saveLicense(env.LICENSES, record);
  if (session.id) {
    await env.LICENSES.put(`session:${session.id}`, licenseKey, {
      expirationTtl: 60 * 60 * 24 * 365,
    });
  }

  try {
    await sendLicenseEmail(env, { to: email, licenseKey });
  } catch (err) {
    const detail = err?.message || "unknown";
    console.error(
      "[stripe-webhook] sendLicenseEmail threw after license saved; queueing email_pending",
      detail,
    );
    await env.LICENSES.put(
      `email_pending:${licenseKey}`,
      JSON.stringify({
        email,
        licenseKey,
        failedAt: Date.now(),
        reason: detail,
      }),
      { expirationTtl: 60 * 60 * 24 * 7 },
    );
    throw err;
  }
}
