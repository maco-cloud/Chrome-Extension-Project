import { getLicense, recordValidation } from "../services/license-store.js";
import { checkRateLimit } from "../services/rate-limit.js";
import { isValidLicenseFormat, normalizeLicenseKey, getClientIp } from "../utils/sanitize.js";
import { errorResponse, json } from "../utils/response.js";

export async function handleValidateLicense(request, env) {
  const ip = getClientIp(request);
  const maxReq = Number(env.RATE_LIMIT_VALIDATE || 30);
  const windowSec = Number(env.RATE_LIMIT_WINDOW_SEC || 60);
  const limit = await checkRateLimit(env.LICENSES, ip, "validate", maxReq, windowSec);
  if (!limit.allowed) {
    return errorResponse("Too many requests. Please try again shortly.", 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const key = normalizeLicenseKey(body.key || body.licenseKey);
  const deviceFingerprint = String(body.deviceFingerprint || "").slice(0, 64) || null;

  if (!key || !isValidLicenseFormat(key)) {
    return json({
      valid: false,
      revoked: false,
      expired: false,
      message: "That license key could not be verified.",
    });
  }

  const license = await getLicense(env.LICENSES, key);
  if (!license) {
    return json({
      valid: false,
      revoked: false,
      expired: false,
      message: "That license key could not be verified.",
    });
  }

  if (license.revoked) {
    return json({
      valid: false,
      revoked: true,
      expired: true,
      message: "This license key is no longer active.",
    });
  }

  const maxActivations = Number(env.MAX_ACTIVATIONS_PER_LICENSE || 3);
  const fps = license.deviceFingerprints || [];
  const isNewDevice =
    deviceFingerprint && !fps.includes(deviceFingerprint) && fps.length >= maxActivations;

  if (isNewDevice) {
    return json({
      valid: false,
      revoked: false,
      expired: false,
      message:
        "This license is already active on the maximum number of devices. Contact support for a transfer.",
    });
  }

  await recordValidation(env.LICENSES, key, deviceFingerprint);

  return json({
    valid: true,
    revoked: false,
    expired: false,
    plan: license.plan || "lifetime",
    message: "License verified.",
  });
}
