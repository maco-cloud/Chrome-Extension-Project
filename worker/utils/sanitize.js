import { LICENSE_PATTERN } from "./constants.js";

export function normalizeLicenseKey(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function isValidLicenseFormat(key) {
  return LICENSE_PATTERN.test(key);
}

export function sanitizeEmail(raw) {
  const email = String(raw || "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

export function getClientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
