import { buildPurchaseEmailHtml, buildPurchaseEmailText } from "../templates/purchase-email.js";
import { maskEmail, paymentLog } from "../utils/logger.js";

/**
 * Send license email via Resend.
 * @throws {Error} With message including Resend detail on failure
 * @returns {Promise<{ emailId: string|null }>}
 */
export async function sendLicenseEmail(env, { to, licenseKey }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey || String(apiKey).length < 10) {
    paymentLog("error", "email.config_missing", { service: "resend" });
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  if (!to || typeof to !== "string") {
    paymentLog("error", "email.invalid_recipient", {});
    throw new Error("INVALID_EMAIL_RECIPIENT");
  }

  const recipient = to.trim();
  const recipientMasked = maskEmail(recipient);

  const from = env.FROM_EMAIL || "QuickDigest AI <onboarding@resend.dev>";
  const supportEmail = env.SUPPORT_EMAIL || "maco70090@gmail.com";
  const productName = env.PRODUCT_NAME || "QuickDigest AI Lifetime Pro";

  const subject = `Your ${productName} license key`;
  const html = buildPurchaseEmailHtml({
    licenseKey,
    productName,
    supportEmail,
  });
  const text = buildPurchaseEmailText({
    licenseKey,
    productName,
    supportEmail,
  });

  let payloadJson;
  try {
    payloadJson = JSON.stringify({
      from,
      to: [recipient],
      subject,
      html,
      text,
    });
  } catch (err) {
    paymentLog("error", "email.payload_error", {
      recipient: recipientMasked,
      reason: String(err?.message || "stringify_failed").slice(0, 80),
    });
    throw new Error(`MALFORMED_EMAIL_PAYLOAD:${err?.message || "stringify failed"}`);
  }

  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: payloadJson,
    });
  } catch (err) {
    paymentLog("error", "email.network_error", {
      recipient: recipientMasked,
      reason: String(err?.message || "network").slice(0, 80),
    });
    throw new Error(`RESEND_FETCH_FAILED:${err?.message || "network"}`);
  }

  const httpStatus = response.status;
  const rawBody = await response.text();

  let parsed = null;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const resendMessage = parsed?.message || null;
    const resendName = parsed?.name || null;
    const combinedDetail =
      [resendMessage, resendName].filter(Boolean).join(" — ") ||
      `HTTP_${httpStatus}`;

    paymentLog("error", "email.send_failed", {
      recipient: recipientMasked,
      httpStatus,
      reason: combinedDetail.slice(0, 120),
    });

    throw new Error(`RESEND_SEND_FAILED:${combinedDetail}`);
  }

  const emailId = parsed?.id || null;

  paymentLog("info", "email.sent", {
    recipient: recipientMasked,
    httpStatus,
    resendEmailId: emailId || "unknown",
  });

  return { emailId };
}
