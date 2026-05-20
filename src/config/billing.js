/** Lifetime-only billing configuration. */
export const BILLING = {
  /** Use remote Worker API when LICENSE_API_URL is set. */
  LICENSE_PROVIDER: "api",

  /** Live Payment Link — used when USE_TEST_CHECKOUT is false (production). */
  CHECKOUT_LIFETIME_URL: "https://buy.stripe.com/8x228r7M6cy3emAddw3VC03",

  /** Stripe Test mode Payment Link — dev only; never used when USE_TEST_CHECKOUT is false. */
  CHECKOUT_LIFETIME_TEST_URL:
    "https://buy.stripe.com/test_4gM5kD5vDgvwfzFdG06wE02",

  /**
   * Set true to open the test checkout link while developing.
   * MUST be false before Chrome Web Store submission.
   */
  USE_TEST_CHECKOUT: false,

  /**
   * Cloudflare Worker license API base URL (no trailing slash).
   * Set after deploy: https://quickdigest-license-api.<account>.workers.dev
   */
  LICENSE_API_URL: "https://quickdigest-license-api.maco70090.workers.dev",

  SUPPORT_EMAIL: "maco70090@gmail.com",
};

/** Checkout URL for the current environment (test vs live). */
export function getCheckoutLifetimeUrl() {
  return BILLING.USE_TEST_CHECKOUT
    ? BILLING.CHECKOUT_LIFETIME_TEST_URL
    : BILLING.CHECKOUT_LIFETIME_URL;
}

export function isLicenseApiEnabled() {
  return Boolean(BILLING.LICENSE_API_URL && BILLING.LICENSE_API_URL.startsWith("https://"));
}

export const PRICING = {
  lifetime: {
    label: "Lifetime Pro",
    priceUsd: 14.99,
    priceDisplay: "$14.99",
    currency: "USD",
    headline: "One-time purchase",
    subline: "Pay once, use forever",
    tagline: "Lifetime access on this device",
    cta: "Continue to secure checkout",
    checkoutLoading: "Opening secure checkout…",
    badge: "Most popular",
  },
};

/** Shown prominently in the upgrade modal. */
export const PURCHASE_PROMISE = {
  headline: "After checkout, your lifetime license key will be emailed to you.",
  detail:
    "No subscription. No recurring billing. No account required. Paste your key here to unlock Pro permanently on this device.",
};

/** Trust bullets under the purchase promise. */
export const TRUST_POINTS = [
  "One-time payment — lifetime access",
  "License key sent to your email after payment",
  "Activate instantly inside the extension",
  "Secure checkout powered by Stripe",
];

/** Free vs Pro rows for upgrade modal comparison. */
export const PLAN_COMPARISON = [
  { feature: "Summaries per day", free: "5", pro: "Unlimited" },
  { feature: "Summary modes", free: "3 core modes", pro: "All 9 modes" },
  { feature: "Saved history", free: "3 items", pro: "Unlimited" },
  { feature: "Export & copy", free: "—", pro: "Markdown & TXT" },
  { feature: "Billing", free: "Free forever", pro: "One-time · no subscription" },
];

/** Numbered steps in the upgrade modal. */
export const PURCHASE_STEPS = [
  {
    title: "Pay once on Stripe",
    detail: `${PRICING.lifetime.priceDisplay} lifetime — not a subscription.`,
  },
  {
    title: "Check your email",
    detail: "Your license key arrives automatically (usually within minutes).",
  },
  {
    title: "Activate in the extension",
    detail: "Paste the key here — Pro unlocks immediately on this browser.",
  },
];

/** Instructions in the license activation modal. */
export const LICENSE_ACTIVATION_STEPS = [
  "Open the email from QuickDigest AI or your Stripe receipt (check spam).",
  "Copy your full license key — it starts with QD- and has four groups of characters.",
  "Paste it below and tap Activate Lifetime Pro.",
];

export const LICENSE_MODAL_COPY = {
  lead:
    "Your lifetime license key unlocks Pro permanently on this browser. No account or subscription needed.",
  postCheckoutNote:
    "Just finished checkout? Check your inbox — your license key was sent automatically.",
};
