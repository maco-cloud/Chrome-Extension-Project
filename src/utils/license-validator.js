import { BILLING, isLicenseApiEnabled } from "../config/billing.js";
import { IS_DEV_BUILD } from "../config/build.js";
import { LICENSE_MESSAGES } from "./user-messages.js";

/** @typedef {'valid'|'invalid'|'expired'|'network_error'} LicenseStatus */
/** @typedef {'lifetime'} LicensePlan */

/**
 * @typedef {Object} LicenseValidationResult
 * @property {LicenseStatus} status
 * @property {string} message
 * @property {LicensePlan|null} plan
 * @property {number|null} expiresAt
 * @property {string} provider
 */

/** Issued keys use this format (email to customers after Stripe purchase). */
const LICENSE_KEY_PATTERN = /^QD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function buildResult(partial) {
  return {
    status: partial.status,
    message: partial.message,
    plan: partial.plan ?? null,
    expiresAt: partial.expiresAt ?? null,
    provider: partial.provider ?? "local",
  };
}

export function normalizeLicenseKey(raw) {
  return (raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

function validateProductionFormat(key) {
  if (!LICENSE_KEY_PATTERN.test(key)) {
    return buildResult({
      status: "invalid",
      message: LICENSE_MESSAGES.invalid,
      plan: null,
    });
  }

  return buildResult({
    status: "valid",
    plan: "lifetime",
    expiresAt: null,
    message: LICENSE_MESSAGES.successTitle,
    provider: "format",
  });
}

async function validateRemoteLicense(key, deviceFingerprint = null) {
  if (!isLicenseApiEnabled()) {
    return null;
  }

  const base = BILLING.LICENSE_API_URL.replace(/\/$/, "");

  try {
    const response = await fetch(`${base}/validate-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, deviceFingerprint }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      return buildResult({
        status: "network_error",
        message: LICENSE_MESSAGES.network,
        plan: null,
        provider: "api",
      });
    }

    if (data.valid) {
      return buildResult({
        status: "valid",
        plan: "lifetime",
        expiresAt: null,
        message: LICENSE_MESSAGES.successTitle,
        provider: "api",
      });
    }

    if (data.revoked || data.expired) {
      return buildResult({
        status: "expired",
        plan: "lifetime",
        message: LICENSE_MESSAGES.expired,
        provider: "api",
      });
    }

    return buildResult({
      status: "invalid",
      message: data.message || LICENSE_MESSAGES.invalid,
      plan: null,
      provider: "api",
    });
  } catch {
    return buildResult({
      status: "network_error",
      message: LICENSE_MESSAGES.network,
      plan: null,
      provider: "api",
    });
  }
}

async function validateDevOnlyKeys(key) {
  if (!IS_DEV_BUILD) {
    return null;
  }

  const { validateDevLicenseKey } = await import("./license-validator.dev.js");
  return validateDevLicenseKey(key);
}

/**
 * @param {string} rawKey
 * @param {{ provider?: string, deviceFingerprint?: string, skipRemote?: boolean }} [options]
 * @returns {Promise<LicenseValidationResult>}
 */
export async function validateLicenseKey(rawKey, options = {}) {
  const key = normalizeLicenseKey(rawKey);
  if (!key || key.length < 12) {
    return buildResult({
      status: "invalid",
      message: LICENSE_MESSAGES.empty,
      plan: null,
    });
  }

  if (!LICENSE_KEY_PATTERN.test(key)) {
    return buildResult({
      status: "invalid",
      message: LICENSE_MESSAGES.invalid,
      plan: null,
    });
  }

  const deviceFingerprint = options.deviceFingerprint || null;
  const apiEnabled = isLicenseApiEnabled();

  if (!options.skipRemote && apiEnabled) {
    const remote = await validateRemoteLicense(key, deviceFingerprint);
    if (remote) {
      if (remote.status === "network_error") {
        return remote;
      }
      return remote;
    }
  }

  const devResult = await validateDevOnlyKeys(key);
  if (devResult) {
    return devResult;
  }

  if (apiEnabled) {
    return buildResult({
      status: "invalid",
      message: LICENSE_MESSAGES.invalid,
      plan: null,
      provider: "api",
    });
  }

  return validateProductionFormat(key);
}
