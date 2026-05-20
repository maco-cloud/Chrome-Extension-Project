import { buildPurchaseEmailHtml, buildPurchaseEmailText } from "../templates/purchase-email.js";

/** Truncate for logs only — never log secrets or full HTML. */
function previewForLog(text, maxLen = 400) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

/**
 * Send license email via Resend.
 * @throws {Error} With message including Resend detail on failure
 * @returns {Promise<{ emailId: string|null }>}
 */
export async function sendLicenseEmail(env, { to, licenseKey }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey || String(apiKey).length < 10) {
    console.error(
      "[quickdigest-email] Missing or invalid RESEND_API_KEY — run: wrangler secret put RESEND_API_KEY",
    );
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  if (!to || typeof to !== "string") {
    console.error("[quickdigest-email] Invalid recipient address (missing or not a string)");
    throw new Error("INVALID_EMAIL_RECIPIENT");
  }

  const recipient = to.trim();

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
    console.error("[quickdigest-email] Malformed email payload:", err?.message || err);
    throw new Error(`MALFORMED_EMAIL_PAYLOAD:${err?.message || " stringify failed"}`);
  }

  console.log(
    `[quickdigest-email] Sending via Resend (recipient=${recipient}, fromConfigured=yes)`,
  );

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
    console.error(
      "[quickdigest-email] Resend fetch failed:",
      err?.message || String(err),
    );
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

    console.error(
      "[quickdigest-email] Resend rejection:",
      JSON.stringify({
        recipient,
        httpStatus,
        resendMessage,
        resendName,
        bodyPreview: previewForLog(rawBody),
      }),
    );

    throw new Error(`RESEND_SEND_FAILED:${combinedDetail}`);
  }

  const emailId = parsed?.id || null;

  console.log(
    "[quickdigest-email] License email sent successfully",
    JSON.stringify({
      recipient,
      httpStatus,
      resendEmailId: emailId || "unknown_id",
    }),
  );

  return { emailId };
}
