import {
  EXTENSION_VERSION,
  MESSAGE_TYPES,
  SUMMARY_ENGINES,
} from "../utils/constants.js";
import { sendMessage } from "../utils/messaging.js";
import { getEntitlementState } from "../utils/entitlements.js";
import { LICENSE_MESSAGES } from "../utils/user-messages.js";
import {
  getSettings,
  saveDarkMode,
  saveSummaryEngine,
} from "../utils/storage.js";

const els = {
  engineSelect: document.getElementById("engineSelect"),
  engineHelp: document.getElementById("engineHelp"),
  chromeAiStatus: document.getElementById("chromeAiStatus"),
  darkModeToggle: document.getElementById("darkModeToggle"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  status: document.getElementById("status"),
  version: document.getElementById("version"),
  licenseKeyField: document.getElementById("licenseKeyField"),
  activateLicenseOptionsBtn: document.getElementById("activateLicenseOptionsBtn"),
  removeLicenseBtn: document.getElementById("removeLicenseBtn"),
  licenseStatus: document.getElementById("licenseStatus"),
  planStatus: document.getElementById("planStatus"),
};

function applyTheme(darkMode) {
  document.documentElement.setAttribute(
    "data-theme",
    darkMode ? "dark" : "light",
  );
}

function setStatus(message) {
  els.status.textContent = message;
}

async function refreshPlanUi() {
  const [state, license] = await Promise.all([
    getEntitlementState(),
    sendMessage(MESSAGE_TYPES.GET_LICENSE).catch(() => null),
  ]);

  if (license?.maskedKey) {
    els.licenseStatus.textContent = `License: ${license.maskedKey} (Lifetime Pro)`;
    els.licenseStatus.classList.add("ok");
  } else {
    els.licenseStatus.textContent = "No license on this device.";
    els.licenseStatus.classList.remove("ok");
  }

  if (state.isPro) {
    els.planStatus.textContent = "Plan: Lifetime Pro";
  } else if (state.licenseExpired) {
    els.planStatus.textContent = "Plan: Free (license inactive)";
  } else {
    els.planStatus.textContent = "Plan: Free";
  }
}

async function refreshChromeAiStatus() {
  try {
    const status = await sendMessage(MESSAGE_TYPES.GET_ENGINE_STATUS);
    if (status.available) {
      els.chromeAiStatus.textContent = "On-device AI: available on this browser";
      els.chromeAiStatus.classList.add("ok");
    } else {
      els.chromeAiStatus.textContent =
        "On-device AI unavailable on this device. Local processing is used automatically.";
      els.chromeAiStatus.classList.remove("ok");
    }
  } catch {
    els.chromeAiStatus.textContent =
      "On-device AI unavailable on this device. Local processing is used automatically.";
    els.chromeAiStatus.classList.remove("ok");
  }
}

async function init() {
  els.version.textContent = `QuickDigest AI v${EXTENSION_VERSION}`;
  const settings = await getSettings();
  els.engineSelect.value = settings.summaryEngine;
  els.darkModeToggle.checked = settings.darkMode;
  applyTheme(settings.darkMode);
  await refreshPlanUi();
  await refreshChromeAiStatus();
}

els.activateLicenseOptionsBtn.addEventListener("click", async () => {
  const key = els.licenseKeyField.value.trim();
  if (!key) {
    setStatus(LICENSE_MESSAGES.empty);
    return;
  }

  els.activateLicenseOptionsBtn.disabled = true;
  setStatus(LICENSE_MESSAGES.activating);

  try {
    const result = await sendMessage(MESSAGE_TYPES.ACTIVATE_LICENSE, {
      licenseKey: key,
    });
    if (!result?.ok) {
      setStatus(result?.message || LICENSE_MESSAGES.invalid);
      return;
    }
    setStatus(result.message || LICENSE_MESSAGES.success);
    els.licenseKeyField.value = "";
    await refreshPlanUi();
  } catch (error) {
    setStatus(error.message || LICENSE_MESSAGES.network);
  } finally {
    els.activateLicenseOptionsBtn.disabled = false;
  }
});

els.removeLicenseBtn.addEventListener("click", async () => {
  await sendMessage(MESSAGE_TYPES.DEACTIVATE_LICENSE);
  els.licenseKeyField.value = "";
  setStatus("License removed from this device.");
  await refreshPlanUi();
});

els.engineSelect.addEventListener("change", async (event) => {
  const value = event.target.value;
  if (!Object.values(SUMMARY_ENGINES).includes(value)) {
    return;
  }
  await saveSummaryEngine(value);
  setStatus("Summary engine preference saved.");
});

els.darkModeToggle.addEventListener("change", async (event) => {
  const enabled = event.target.checked;
  await saveDarkMode(enabled);
  applyTheme(enabled);
  setStatus(enabled ? "Dark mode enabled." : "Light mode enabled.");
});

els.clearHistoryBtn.addEventListener("click", async () => {
  const confirmed = confirm(
    "Clear all saved summaries? This cannot be undone.",
  );
  if (!confirmed) {
    return;
  }
  await sendMessage(MESSAGE_TYPES.CLEAR_HISTORY);
  setStatus("History cleared.");
});

init().catch((error) => {
  setStatus(error.message || "Failed to load settings.");
});
