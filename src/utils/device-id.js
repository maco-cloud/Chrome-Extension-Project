import { STORAGE_KEYS } from "./constants.js";
import { getFromStorage, setInStorage } from "./storage.js";

/**
 * Privacy-friendly install identifier (random, local-only).
 * Used for lightweight license binding — not shared except optional API validation.
 */
export async function getDeviceId() {
  const data = await getFromStorage([STORAGE_KEYS.DEVICE_ID]);
  let id = data[STORAGE_KEYS.DEVICE_ID];
  if (id && typeof id === "string" && id.length >= 16) {
    return id;
  }

  id = `qd_${crypto.randomUUID().replace(/-/g, "")}`;
  await setInStorage({ [STORAGE_KEYS.DEVICE_ID]: id });
  return id;
}

/** Short hash for server-side device checks without sending raw ID. */
export async function getDeviceIdFingerprint() {
  const id = await getDeviceId();
  const encoded = new TextEncoder().encode(id);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
