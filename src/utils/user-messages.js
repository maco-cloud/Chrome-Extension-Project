/** User-safe messages — never expose stack traces, API names, or internal errors. */

const TECHNICAL_PATTERNS = [
  /stack/i,
  /runtime\.lastError/i,
  /message port/i,
  /extension context/i,
  /summarizer api/i,
  /offscreen/i,
  /uncaught/i,
  /undefined is not/i,
  /chrome\.runtime/i,
  /at \w+\(/,
  /TIMEOUT/,
  /PORT_CLOSED/,
  /AI_UNAVAILABLE/,
  /fetch failed/i,
  /network error/i,
  /JSON\.parse/i,
];

export function isTechnicalMessage(message) {
  const text = String(message || "");
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(text));
}

export function toUserMessage(error, fallback = "Could not complete that action. Please try again.") {
  const raw = error?.userMessage || error?.message || String(error || "");
  if (!raw || isTechnicalMessage(raw)) {
    if (fallback.includes("summarize")) {
      return "Could not summarize this page. Refresh the page and try again.";
    }
    return fallback;
  }

  if (raw.includes("Free limit reached") || raw.includes("Lifetime Pro")) {
    return raw;
  }
  if (raw.includes("license") || raw.includes("License")) {
    return raw;
  }
  if (raw.includes("Cannot access contents") || raw.includes("restricted")) {
    return "This page cannot be summarized. Try a regular article or blog tab.";
  }
  if (raw.includes("Extensions cannot access")) {
    return "This type of page cannot be summarized.";
  }
  if (raw.includes("Not enough readable")) {
    return "Not enough readable content. Try a longer article or video with captions.";
  }
  if (raw.includes("Select more text")) {
    return "Select a bit more text, then try again.";
  }
  if (raw.includes("No active tab")) {
    return "No active tab found. Click the page you want to summarize.";
  }

  return raw.length > 140 ? fallback : raw;
}

export const ENGINE_DISPLAY = {
  local: "Local processing",
  "chrome-ai": "On-device AI",
};

export function engineLabel(engine, usedFallback = false) {
  if (usedFallback || engine === "local") {
    return "Local processing";
  }
  if (engine === "chrome-ai") {
    return "On-device AI";
  }
  return ENGINE_DISPLAY.local;
}

export const LICENSE_MESSAGES = {
  invalid:
    "That license key could not be verified. Double-check the full key from your email and try again.",
  expired:
    "This license key is no longer active. Contact support from your purchase receipt if you need help.",
  cooldown: "Please wait a few seconds before trying again.",
  tooManyAttempts:
    "Too many incorrect attempts. Please wait one minute, then try again.",
  activating: "Verifying your license key…",
  successTitle: "You're all set — Lifetime Pro is active!",
  successSubtitle:
    "Your license is saved on this device. Pay once, use forever — no subscription.",
  empty: "Paste your full license key from your purchase email (starts with QD-).",
  network:
    "We could not verify your key right now. Check your internet connection and try again.",
  transferWarning:
    "This license was used on another browser profile. Contact support if you need to move it.",
  whereToFindTitle: "Where is my license key?",
  whereToFind:
    "After payment, Stripe emails your receipt. Your lifetime license key is in that email — copy the full code starting with QD- (example: QD-AB12-CD34-EF56-GH78).",
  checkoutNextStep:
    "Checkout opened in a new tab. When payment completes, check your email for your license key, then paste it here.",
};

export const SUMMARIZE_STATUS = {
  extracting: "Reading page content…",
  youtube: "Extracting transcript…",
  generating: "Building your summary…",
  regenerating: "Regenerating summary…",
};
