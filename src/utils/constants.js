export const EXTENSION_NAME = "QuickDigest AI";
export const EXTENSION_VERSION = "1.1.0";
export const MAX_HISTORY_ITEMS = 20;
export const MAX_CONTENT_CHARS = 14000;
export const MIN_CONTENT_CHARS = 80;
export const WORDS_PER_MINUTE = 225;
export const OFFSCREEN_DOCUMENT_PATH = "src/background/offscreen.html";

export const SUMMARY_ENGINES = {
  AUTO: "auto",
  LOCAL: "local",
  CHROME_AI: "chrome-ai",
};

export const ENGINE_LABELS = {
  auto: "Auto (best available)",
  local: "Local (always free)",
  "chrome-ai": "Chrome on-device AI",
};

export const ENGINE_BADGES = {
  local: "Local engine",
  "chrome-ai": "Chrome on-device AI",
  auto: "Auto",
};

export const STORAGE_KEYS = {
  SUMMARY_ENGINE: "summaryEngine",
  DARK_MODE: "darkMode",
  HISTORY: "summaryHistory",
};

export const MESSAGE_TYPES = {
  SUMMARIZE: "SUMMARIZE",
  GET_SETTINGS: "GET_SETTINGS",
  GET_HISTORY: "GET_HISTORY",
  CLEAR_HISTORY: "CLEAR_HISTORY",
  DELETE_HISTORY_ITEM: "DELETE_HISTORY_ITEM",
  GET_ENGINE_STATUS: "GET_ENGINE_STATUS",
  CHROME_AI_SUMMARIZE: "CHROME_AI_SUMMARIZE",
};

export const UNSUPPORTED_URL_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "about:",
  "devtools://",
  "view-source:",
  "chrome.google.com/webstore",
  "chromewebstore.google.com",
];
