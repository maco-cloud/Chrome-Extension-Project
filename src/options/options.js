import {
  EXTENSION_VERSION,
  MESSAGE_TYPES,
  SUMMARY_ENGINES,
} from "../utils/constants.js";
import { sendMessage } from "../utils/messaging.js";
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

async function refreshChromeAiStatus() {
  try {
    const status = await sendMessage(MESSAGE_TYPES.GET_ENGINE_STATUS);
    if (status.available) {
      els.chromeAiStatus.textContent = `Chrome on-device AI: ${status.reason}`;
      els.chromeAiStatus.classList.add("ok");
    } else {
      els.chromeAiStatus.textContent = `Chrome on-device AI: not available (${status.reason}). Local engine will be used.`;
      els.chromeAiStatus.classList.remove("ok");
    }
  } catch (error) {
    els.chromeAiStatus.textContent = `Chrome on-device AI: unavailable (${error.message}).`;
    els.chromeAiStatus.classList.remove("ok");
  }
}

async function init() {
  els.version.textContent = `QuickDigest AI v${EXTENSION_VERSION}`;
  const settings = await getSettings();
  els.engineSelect.value = settings.summaryEngine;
  els.darkModeToggle.checked = settings.darkMode;
  applyTheme(settings.darkMode);
  await refreshChromeAiStatus();
}

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
