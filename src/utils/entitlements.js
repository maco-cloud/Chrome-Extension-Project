import { IS_DEV_BUILD } from "../config/build.js";
import {
  FREE_DAILY_SUMMARY_LIMIT,
  FREE_HISTORY_LIMIT,
  STORAGE_KEYS,
} from "./constants.js";
import { refreshLicenseStatus } from "./license.js";
import { getFromStorage, setInStorage } from "./storage.js";
import { getHistory } from "./storage.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getDevProEntitlement() {
  if (!IS_DEV_BUILD) {
    return { active: false, source: null };
  }
  const data = await getFromStorage([STORAGE_KEYS.PRO_ENTITLEMENT]);
  const raw = data[STORAGE_KEYS.PRO_ENTITLEMENT];
  if (!raw?.active || raw.source !== "dev") {
    return { active: false, source: null };
  }
  return raw;
}

export async function getProEntitlement() {
  const licenseState = await refreshLicenseStatus();
  if (licenseState.active) {
    return {
      active: true,
      source: "license",
      plan: "lifetime",
      since: licenseState.stored?.activatedAt,
      expiresAt: null,
      suspiciousReuse: Boolean(licenseState.suspiciousReuse),
      offlineGrace: Boolean(licenseState.offlineGrace),
    };
  }

  if (licenseState.status === "expired") {
    return { active: false, source: null, expired: true };
  }

  const dev = await getDevProEntitlement();
  if (dev.active) {
    return dev;
  }

  return { active: false, source: null };
}

export async function isProUser() {
  const pro = await getProEntitlement();
  return Boolean(pro.active);
}

/** Dev-only — not callable from production UI when IS_DEV_BUILD is false. */
export async function setProEntitlement(active) {
  if (!IS_DEV_BUILD) {
    return;
  }
  await setInStorage({
    [STORAGE_KEYS.PRO_ENTITLEMENT]: active
      ? { active: true, source: "dev", since: Date.now() }
      : { active: false },
  });
}

export async function getDailyUsage() {
  const data = await getFromStorage([STORAGE_KEYS.DAILY_USAGE]);
  const usage = data[STORAGE_KEYS.DAILY_USAGE] || { date: todayKey(), count: 0 };
  if (usage.date !== todayKey()) {
    return { date: todayKey(), count: 0 };
  }
  return usage;
}

export async function incrementDailyUsage() {
  const usage = await getDailyUsage();
  const next = { date: todayKey(), count: usage.count + 1 };
  await setInStorage({ [STORAGE_KEYS.DAILY_USAGE]: next });
  return next;
}

export async function getEntitlementState() {
  const [pro, usage, history] = await Promise.all([
    getProEntitlement(),
    getDailyUsage(),
    getHistory(),
  ]);

  const isPro = Boolean(pro.active);
  const historyCount = history.length;

  return {
    isPro,
    plan: isPro ? "pro" : "free",
    proPlan: isPro ? "lifetime" : null,
    proSource: pro.source || null,
    licenseExpired: Boolean(pro.expired),
    licenseTransferWarning: Boolean(pro.suspiciousReuse),
    offlineGrace: Boolean(pro.offlineGrace),
    usedToday: usage.count,
    limit: isPro ? null : FREE_DAILY_SUMMARY_LIMIT,
    remaining: isPro ? null : Math.max(0, FREE_DAILY_SUMMARY_LIMIT - usage.count),
    canSummarize: isPro || usage.count < FREE_DAILY_SUMMARY_LIMIT,
    historyCount,
    historyLimit: isPro ? null : FREE_HISTORY_LIMIT,
    canSaveHistory: isPro || historyCount < FREE_HISTORY_LIMIT,
    historyRemaining: isPro ? null : Math.max(0, FREE_HISTORY_LIMIT - historyCount),
  };
}

export async function assertCanSummarize() {
  const state = await getEntitlementState();
  if (!state.canSummarize) {
    throw new Error(
      `Free limit reached (${FREE_DAILY_SUMMARY_LIMIT}/day). Get Lifetime Pro for unlimited summaries.`,
    );
  }
  return state;
}

export function canUseFeature(feature, state) {
  const proFeatures = new Set([
    "history_unlimited",
    "export_md",
    "export_txt",
    "copy_all",
    "copy_markdown",
    "advanced_modes",
    "share_formatted",
  ]);

  if (!proFeatures.has(feature)) {
    return true;
  }
  return state.isPro;
}
