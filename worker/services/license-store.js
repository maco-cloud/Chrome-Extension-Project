import { KV_PREFIX, PLAN_LIFETIME } from "../utils/constants.js";
import { normalizeLicenseKey } from "../utils/sanitize.js";

function licenseKvKey(key) {
  return `${KV_PREFIX.LICENSE}${normalizeLicenseKey(key)}`;
}

function eventKvKey(eventId) {
  return `${KV_PREFIX.EVENT}${eventId}`;
}

export async function getLicense(kv, key) {
  const raw = await kv.get(licenseKvKey(key), "json");
  return raw || null;
}

export async function saveLicense(kv, record) {
  const normalized = normalizeLicenseKey(record.licenseKey);
  const data = {
    ...record,
    licenseKey: normalized,
    plan: record.plan || PLAN_LIFETIME,
    revoked: Boolean(record.revoked),
    activationCount: record.activationCount || 0,
    deviceFingerprints: record.deviceFingerprints || [],
    validationTimestamps: record.validationTimestamps || [],
  };
  await kv.put(licenseKvKey(normalized), JSON.stringify(data));
  return data;
}

export async function markEventProcessed(kv, eventId) {
  await kv.put(eventKvKey(eventId), String(Date.now()), {
    expirationTtl: 60 * 60 * 24 * 30,
  });
}

export async function isEventProcessed(kv, eventId) {
  const val = await kv.get(eventKvKey(eventId));
  return Boolean(val);
}

export async function recordValidation(kv, key, deviceFingerprint) {
  const license = await getLicense(kv, key);
  if (!license) {
    return null;
  }

  const fps = new Set(license.deviceFingerprints || []);
  if (deviceFingerprint) {
    fps.add(deviceFingerprint);
  }

  const validationTimestamps = [
    ...(license.validationTimestamps || []),
    Date.now(),
  ].slice(-20);

  let activationCount = license.activationCount || 0;
  if (deviceFingerprint && !license.deviceFingerprints?.includes(deviceFingerprint)) {
    activationCount += 1;
  }

  const updated = {
    ...license,
    deviceFingerprints: [...fps].slice(0, 10),
    validationTimestamps,
    activationCount: Math.max(license.activationCount || 0, activationCount),
    lastValidatedAt: Date.now(),
  };

  await saveLicense(kv, updated);
  return updated;
}

export async function revokeLicense(kv, key, reason = "admin") {
  const license = await getLicense(kv, key);
  if (!license) {
    return null;
  }
  const updated = {
    ...license,
    revoked: true,
    revokedAt: Date.now(),
    revokeReason: reason,
  };
  await saveLicense(kv, updated);
  return updated;
}

export function createLicenseRecord({ licenseKey, email, stripeSessionId, stripeEventId }) {
  return {
    licenseKey,
    email,
    plan: PLAN_LIFETIME,
    purchasedAt: Date.now(),
    createdAt: Date.now(),
    revoked: false,
    stripeSessionId: stripeSessionId || null,
    stripeEventId: stripeEventId || null,
    activationCount: 0,
    deviceFingerprints: [],
    validationTimestamps: [],
    lastValidatedAt: null,
  };
}
