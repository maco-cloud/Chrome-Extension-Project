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
import { maskEmail, paymentLog, sanitizeLogMessage } from "../utils/logger.js";

function logReturn(status, reason, extra = {}) {
  paymentLog(status >= 400 ? "error" : "info", "webhook.return", {
    status,
    reason,
    ...extra,
  });
}

export async function handleStripeWebhook(request, env) {
  paymentLog("info", "webhook.received", {
    method: request.method,
  });

  const signature = request.headers.get("Stripe-Signature");
  const secret = env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    logReturn(503, "secret_not_configured");
    return errorResponse("Webhook not configured", 503);
  }

  paymentLog("info", "webhook.signature_check_started", {
    hasSignatureHeader: Boolean(signature),
  });

  let payload;
  try {
    payload = await request.text();
  } catch (err) {
    paymentLog("error", "webhook.payload_read_failed", {
      reason: sanitizeLogMessage(err?.message),
    });
    logReturn(400, "payload_read_failed");
    return errorResponse("Invalid payload", 400);
  }

  paymentLog("info", "webhook.payload_read", {
    byteLength: payload?.length || 0,
  });

  let valid;
  try {
    valid = await verifyStripeWebhook(payload, signature, secret);
  } catch (err) {
    paymentLog("error", "webhook.signature_check_error", {
      reason: sanitizeLogMessage(err?.message),
    });
    logReturn(400, "signature_check_error");
    return errorResponse("Invalid signature", 400);
  }

  if (!valid) {
    logReturn(400, "invalid_signature");
    return errorResponse("Invalid signature", 400);
  }

  paymentLog("info", "webhook.signature_verified", {});

  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    paymentLog("error", "webhook.json_parse_failed", {
      reason: sanitizeLogMessage(err?.message),
    });
    logReturn(400, "invalid_json");
    return errorResponse("Invalid payload", 400);
  }

  const eventId = event?.id || "unknown";
  const eventType = event?.type || "unknown";

  paymentLog("info", "webhook.event_parsed", {
    eventId,
    eventType,
  });

  let duplicate;
  try {
    duplicate = await isEventProcessed(env.LICENSES, event.id);
  } catch (err) {
    paymentLog("error", "webhook.kv_check_failed", {
      reason: sanitizeLogMessage(err?.message),
      eventId,
    });
    paymentLog("error", "webhook.process_failed", {
      reason: sanitizeLogMessage(err?.message),
      eventType,
    });
    logReturn(500, "kv_check_failed");
    return errorResponse("Webhook processing failed", 500);
  }

  if (duplicate) {
    logReturn(200, "duplicate_event", { eventId, eventType });
    return json({ ok: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      paymentLog("info", "webhook.checkout_started", { eventId });
      await handleCheckoutCompleted(env, event);
      paymentLog("info", "webhook.checkout_finished", { eventId });
    } else {
      paymentLog("info", "webhook.event_skipped", { eventId, eventType });
    }

    await markEventProcessed(env.LICENSES, event.id);
    paymentLog("info", "webhook.event_marked_processed", { eventId });

    logReturn(200, "received", { eventId, eventType });
    return json({ ok: true, received: true });
  } catch (err) {
    paymentLog("error", "webhook.process_failed", {
      reason: sanitizeLogMessage(err?.message),
      eventType,
      eventId,
    });
    logReturn(500, "processing_failed", { eventId, eventType });
    return errorResponse("Webhook processing failed", 500);
  }
}

async function handleCheckoutCompleted(env, event) {
  const session = event.data?.object;
  if (!session) {
    paymentLog("info", "webhook.checkout_skip", {
      reason: "no_session_object",
      eventId: event.id,
    });
    return;
  }

  if (session.payment_status && session.payment_status !== "paid") {
    paymentLog("info", "webhook.checkout_skip", {
      reason: "payment_not_paid",
      eventId: event.id,
      paymentStatus: session.payment_status,
    });
    return;
  }

  const email =
    sanitizeEmail(session.customer_details?.email) ||
    sanitizeEmail(session.customer_email);

  if (!email) {
    paymentLog("error", "webhook.no_customer_email", {
      sessionId: session.id || "unknown",
      eventId: event.id,
    });
    throw new Error("NO_EMAIL");
  }

  paymentLog("info", "webhook.checkout_customer", {
    sessionId: session.id || "unknown",
    recipient: maskEmail(email),
  });

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
      } catch (parseErr) {
        paymentLog("error", "webhook.pending_parse_failed", {
          reason: sanitizeLogMessage(parseErr?.message),
          sessionId: session.id || "unknown",
        });
        to = pendingRaw;
      }
      paymentLog("info", "email.retry_pending", {
        sessionId: session.id || "unknown",
      });
      await sendLicenseEmail(env, {
        to,
        licenseKey: existingBySession,
      });
      await env.LICENSES.delete(`email_pending:${existingBySession}`);
      paymentLog("info", "webhook.checkout_skip", {
        reason: "existing_session_email_retried",
        sessionId: session.id || "unknown",
      });
    } else {
      paymentLog("info", "webhook.checkout_skip", {
        reason: "existing_session_no_pending_email",
        sessionId: session.id || "unknown",
      });
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

  paymentLog("info", "webhook.license_created", {
    sessionId: session.id || "unknown",
    recipient: maskEmail(email),
  });

  try {
    await sendLicenseEmail(env, { to: email, licenseKey });
  } catch (err) {
    paymentLog("error", "email.queued_for_retry", {
      sessionId: session.id || "unknown",
      reason: sanitizeLogMessage(err?.message),
    });
    await env.LICENSES.put(
      `email_pending:${licenseKey}`,
      JSON.stringify({
        email,
        licenseKey,
        failedAt: Date.now(),
        reason: err?.message || "unknown",
      }),
      { expirationTtl: 60 * 60 * 24 * 7 },
    );
    throw err;
  }
}
