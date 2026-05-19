export const EXTENSION_NAME = "QuickDigest AI";
export const EXTENSION_VERSION = "1.0.0";
export const OPENAI_MODEL = "gpt-4.1-mini";
export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
export const MAX_HISTORY_ITEMS = 20;
export const MAX_CONTENT_CHARS = 14000;
export const MIN_CONTENT_CHARS = 80;
export const API_TIMEOUT_MS = 90000;
export const MAX_RETRIES = 2;
export const WORDS_PER_MINUTE = 225;

export const STORAGE_KEYS = {
  API_KEY: "openaiApiKey",
  DARK_MODE: "darkMode",
  HISTORY: "summaryHistory",
};

export const MESSAGE_TYPES = {
  SUMMARIZE: "SUMMARIZE",
  GET_SETTINGS: "GET_SETTINGS",
  GET_HISTORY: "GET_HISTORY",
  CLEAR_HISTORY: "CLEAR_HISTORY",
  DELETE_HISTORY_ITEM: "DELETE_HISTORY_ITEM",
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
