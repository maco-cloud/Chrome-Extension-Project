import { EXTENSION_VERSION, MESSAGE_TYPES } from "../utils/constants.js";
import { sendMessage } from "../utils/messaging.js";
import { saveApiKey, saveDarkMode, getSettings } from "../utils/storage.js";

const els = {
  apiKey: document.getElementById("apiKey"),
  saveKeyBtn: document.getElementById("saveKeyBtn"),
  toggleKeyBtn: document.getElementById("toggleKeyBtn"),
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

async function init() {
  els.version.textContent = `QuickDigest AI v${EXTENSION_VERSION}`;
  const settings = await getSettings();
  els.apiKey.value = settings.apiKey;
  els.darkModeToggle.checked = settings.darkMode;
  applyTheme(settings.darkMode);
}

els.saveKeyBtn.addEventListener("click", async () => {
  const value = els.apiKey.value.trim();
  if (!value.startsWith("sk-")) {
    setStatus("Enter a valid OpenAI API key (starts with sk-).");
    return;
  }
  await saveApiKey(value);
  setStatus("API key saved securely on this device.");
});

els.toggleKeyBtn.addEventListener("click", () => {
  const isPassword = els.apiKey.type === "password";
  els.apiKey.type = isPassword ? "text" : "password";
  els.toggleKeyBtn.textContent = isPassword ? "Hide key" : "Show key";
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
