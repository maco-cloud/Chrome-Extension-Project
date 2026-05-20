/**
 * Development-only license validation. Not included in production UI or user docs.
 * IS_DEV_BUILD must be true in src/config/build.js to enable.
 */

function buildResult(partial) {
  return {
    status: partial.status,
    message: partial.message,
    plan: partial.plan ?? "lifetime",
    expiresAt: partial.expiresAt ?? null,
    provider: "dev",
  };
}

const DEV_KEYS = new Map([
  [
    "QD-PRO-LIFETIME-DEMO",
    { status: "valid", message: "Lifetime Pro unlocked.", expiresAt: null },
  ],
  [
    "QD-PRO-EXPIRED-DEMO",
    {
      status: "expired",
      message: "This license key is no longer active.",
      expiresAt: Date.now() - 86400000,
    },
  ],
]);

export function validateDevLicenseKey(key) {
  const entry = DEV_KEYS.get(key);
  if (!entry) {
    return null;
  }
  if (entry.status === "expired") {
    return buildResult(entry);
  }
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    return buildResult({
      status: "expired",
      message: "This license key is no longer active.",
      plan: "lifetime",
      expiresAt: entry.expiresAt,
    });
  }
  return buildResult({ ...entry, plan: "lifetime" });
}
