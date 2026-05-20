import { isLicenseApiEnabled } from "../config/billing.js";
import { LICENSE_OFFLINE_GRACE_MS, STORAGE_KEYS } from "./constants.js";
import { getDeviceId, getDeviceIdFingerprint } from "./device-id.js";
import {
  checkActivationAllowed,
  clearActivationFailures,
  recordActivationAttempt,
  recordFailedActivation,
} from "./license-activation-guard.js";
import { LICENSE_MESSAGES } from "./user-messages.js";
import { getFromStorage, setInStorage } from "./storage.js";
import { normalizeLicenseKey, validateLicenseKey } from "./license-validator.js";

export async function getStoredLicense() {
  const data = await getFromStorage([STORAGE_KEYS.LICENSE]);
  return data[STORAGE_KEYS.LICENSE] || null;
}

export async function saveLicense(record) {
  await setInStorage({ [STORAGE_KEYS.LICENSE]: record });
  return record;
}

export async function clearLicense() {
  await setInStorage({ [STORAGE_KEYS.LICENSE]: null });
}

export async function getActivationCooldownRemaining() {
  const check = await checkActivationAllowed();
  if (check.allowed) {
    return 0;
  }
  return check.retryAfterMs || 0;
}

/**
 * @param {string} rawKey
 * @returns {Promise<import('./license-validator.js').LicenseValidationResult & { ok: boolean, license?: object }>}
 */
export async function activateLicense(rawKey) {
  const throttle = await checkActivationAllowed();
  if (!throttle.allowed) {
    return {
      ok: false,
      status: throttle.status,
      message: throttle.message,
      retryAfterMs: throttle.retryAfterMs,
    };
  }

  await recordActivationAttempt();

  const licenseKey = normalizeLicenseKey(rawKey);
  if (!licenseKey) {
    await recordFailedActivation();
    return { ok: false, status: "invalid", message: LICENSE_MESSAGES.empty };
  }

  let validation;
  try {
    const deviceFingerprint = await getDeviceIdFingerprint();
    validation = await validateLicenseKey(licenseKey, { deviceFingerprint });
  } catch {
    await recordFailedActivation();
    return { ok: false, status: "invalid", message: LICENSE_MESSAGES.network };
  }

  if (validation.status === "network_error") {
    return {
      ok: false,
      status: "network",
      message: LICENSE_MESSAGES.network,
    };
  }

  if (validation.status === "invalid") {
    await recordFailedActivation();
    return { ok: false, status: validation.status, message: validation.message };
  }

  if (validation.status === "expired") {
    await recordFailedActivation();
    return { ok: false, status: validation.status, message: validation.message };
  }

  const deviceId = await getDeviceId();
  const record = {
    licenseKey,
    plan: "lifetime",
    provider: validation.provider,
    activatedAt: Date.now(),
    expiresAt: null,
    deviceId,
    deviceFingerprint: await getDeviceIdFingerprint(),
    lastValidatedAt: Date.now(),
    apiValidated: validation.provider === "api",
  };

  await saveLicense(record);
  await clearActivationFailures();

  return {
    ok: true,
    status: "valid",
    message: LICENSE_MESSAGES.successTitle,
    subtitle: LICENSE_MESSAGES.successSubtitle,
    license: record,
  };
}

export async function refreshLicenseStatus() {
  const stored = await getStoredLicense();
  if (!stored?.licenseKey) {
    return { active: false, stored: null };
  }

  const currentDeviceId = await getDeviceId();
  const deviceMismatch =
    Boolean(stored.deviceId) && stored.deviceId !== currentDeviceId;

  let validation;
  try {
    const deviceFingerprint = await getDeviceIdFingerprint();
    validation = await validateLicenseKey(stored.licenseKey, {
      deviceFingerprint,
      skipRemote: false,
    });
  } catch {
    validation = { status: "network_error" };
  }

  if (validation.status === "network_error") {
    const lastOk = stored.lastValidatedAt || stored.activatedAt || 0;
    const withinGrace = Date.now() - lastOk < LICENSE_OFFLINE_GRACE_MS;
    if (!isLicenseApiEnabled() || withinGrace) {
      return {
        active: true,
        stored,
        status: "valid",
        offlineGrace: true,
        deviceMismatch,
      };
    }
  }

  if (validation.status !== "valid") {
    await clearLicense();
    return {
      active: false,
      stored: null,
      status: validation.status,
      message: validation.message,
    };
  }

  const updated = {
    ...stored,
    plan: "lifetime",
    expiresAt: null,
    lastValidatedAt: Date.now(),
    apiValidated: validation.provider === "api" || stored.apiValidated,
    deviceId: stored.deviceId || currentDeviceId,
    deviceFingerprint:
      stored.deviceFingerprint || (await getDeviceIdFingerprint()),
  };

  if (!stored.deviceId) {
    await saveLicense(updated);
  }

  return {
    active: true,
    stored: updated,
    status: "valid",
    message: LICENSE_MESSAGES.successTitle,
    deviceMismatch,
    suspiciousReuse: deviceMismatch,
  };
}

export async function getLicenseSummary() {
  const stored = await getStoredLicense();
  if (!stored) {
    return null;
  }
  return {
    plan: "lifetime",
    maskedKey: maskLicenseKey(stored.licenseKey),
    expiresAt: null,
    activatedAt: stored.activatedAt,
  };
}

export function maskLicenseKey(key) {
  if (!key || key.length < 8) {
    return "••••";
  }
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
