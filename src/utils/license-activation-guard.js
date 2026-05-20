import { STORAGE_KEYS } from "./constants.js";
import { LICENSE_MESSAGES } from "./user-messages.js";
import { getFromStorage, setInStorage } from "./storage.js";

const COOLDOWN_MS = 5000;
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 60 * 1000;

export async function getActivationMeta() {
  const data = await getFromStorage([STORAGE_KEYS.LICENSE_ACTIVATION]);
  return (
    data[STORAGE_KEYS.LICENSE_ACTIVATION] || {
      lastAttemptAt: 0,
      failedAttempts: 0,
      failedWindowStart: 0,
      lockoutUntil: 0,
    }
  );
}

export async function checkActivationAllowed() {
  const meta = await getActivationMeta();
  const now = Date.now();

  if (meta.lockoutUntil && meta.lockoutUntil > now) {
    return {
      allowed: false,
      status: "lockout",
      message: LICENSE_MESSAGES.tooManyAttempts,
      retryAfterMs: meta.lockoutUntil - now,
    };
  }

  const elapsed = now - (meta.lastAttemptAt || 0);
  if (meta.lastAttemptAt && elapsed < COOLDOWN_MS) {
    return {
      allowed: false,
      status: "cooldown",
      message: LICENSE_MESSAGES.cooldown,
      retryAfterMs: COOLDOWN_MS - elapsed,
    };
  }

  return { allowed: true };
}

export async function recordActivationAttempt() {
  const meta = await getActivationMeta();
  await setInStorage({
    [STORAGE_KEYS.LICENSE_ACTIVATION]: {
      ...meta,
      lastAttemptAt: Date.now(),
    },
  });
}

export async function recordFailedActivation() {
  const meta = await getActivationMeta();
  const now = Date.now();
  let failedAttempts = meta.failedAttempts || 0;
  let failedWindowStart = meta.failedWindowStart || now;

  if (now - failedWindowStart > FAILED_WINDOW_MS) {
    failedAttempts = 0;
    failedWindowStart = now;
  }

  failedAttempts += 1;
  const next = {
    ...meta,
    lastAttemptAt: now,
    failedAttempts,
    failedWindowStart,
  };

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    next.lockoutUntil = now + LOCKOUT_MS;
    next.failedAttempts = 0;
    next.failedWindowStart = now;
  }

  await setInStorage({ [STORAGE_KEYS.LICENSE_ACTIVATION]: next });
}

export async function clearActivationFailures() {
  const meta = await getActivationMeta();
  await setInStorage({
    [STORAGE_KEYS.LICENSE_ACTIVATION]: {
      ...meta,
      failedAttempts: 0,
      lockoutUntil: 0,
      failedWindowStart: 0,
    },
  });
}
