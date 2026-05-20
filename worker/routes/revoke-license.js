import { revokeLicense, getLicense } from "../services/license-store.js";
import { isValidLicenseFormat, normalizeLicenseKey } from "../utils/sanitize.js";
import { errorResponse, json } from "../utils/response.js";

export async function handleRevokeLicense(request, env) {
  const secret = env.REVOKE_SECRET;
  const auth = request.headers.get("Authorization") || "";
  const headerSecret = request.headers.get("X-Admin-Secret") || "";

  const token = auth.startsWith("Bearer ") ? auth.slice(7) : headerSecret;
  if (!secret || token !== secret) {
    return errorResponse("Unauthorized", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const key = normalizeLicenseKey(body.key || body.licenseKey);
  if (!isValidLicenseFormat(key)) {
    return errorResponse("Invalid license key format", 400);
  }

  const existing = await getLicense(env.LICENSES, key);
  if (!existing) {
    return errorResponse("License not found", 404);
  }

  await revokeLicense(env.LICENSES, key, body.reason || "admin");

  return json({
    ok: true,
    revoked: true,
    licenseKey: key,
  });
}
