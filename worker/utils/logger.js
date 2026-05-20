/** Production-safe payment diagnostics — never log secrets, keys, or raw API bodies. */

export function maskEmail(email) {
  const value = String(email || "").trim();
  const at = value.indexOf("@");
  if (at < 1) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const maskedLocal =
    local.length <= 2 ? "*".repeat(local.length) : `${local[0]}***${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

/** Strip license-key-shaped tokens from error text before logging. */
export function sanitizeLogMessage(message) {
  return String(message || "unknown")
    .replace(/QD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/gi, "QD-****")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 200);
}

/**
 * @param {"info"|"error"} level
 * @param {string} event
 * @param {Record<string, string|number|boolean|null|undefined>} [meta]
 */
export function paymentLog(level, event, meta = {}) {
  const payload = { event, ...meta };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(`[quickdigest] ${line}`);
  } else {
    console.log(`[quickdigest] ${line}`);
  }
}
