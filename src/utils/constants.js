export const EXTENSION_NAME = "QuickDigest AI";
export const EXTENSION_VERSION = "2.1.0";
export const MAX_HISTORY_ITEMS = 50;
export const MAX_RECENT_PAGES = 12;
export const MAX_CONTENT_CHARS = 16000;
export const MIN_CONTENT_CHARS = 80;
export const MIN_SELECTION_CHARS = 40;
export const WORDS_PER_MINUTE = 225;
export const EXTRACTION_CACHE_TTL_MS = 5 * 60 * 1000;
export const OFFSCREEN_DOCUMENT_PATH = "src/background/offscreen.html";

export const SUMMARY_ENGINES = {
  AUTO: "auto",
  LOCAL: "local",
  CHROME_AI: "chrome-ai",
};

export const ENGINE_BADGES = {
  local: "Local engine",
  "chrome-ai": "Chrome on-device AI",
  auto: "Auto",
};

export const SENTIMENT_LABELS = {
  positive: "Positive tone",
  negative: "Critical tone",
  neutral: "Neutral tone",
  mixed: "Mixed tone",
};

export const STORAGE_KEYS = {
  SUMMARY_ENGINE: "summaryEngine",
  DARK_MODE: "darkMode",
  HISTORY: "summaryHistory",
  RECENT_PAGES: "recentPages",
};

export const SESSION_KEYS = {
  POPUP_PAYLOAD: "popupPayload",
};

export const MESSAGE_TYPES = {
  SUMMARIZE: "SUMMARIZE",
  SUMMARIZE_SELECTION: "SUMMARIZE_SELECTION",
  GET_PAGE_CONTEXT: "GET_PAGE_CONTEXT",
  GET_SETTINGS: "GET_SETTINGS",
  GET_HISTORY: "GET_HISTORY",
  CLEAR_HISTORY: "CLEAR_HISTORY",
  DELETE_HISTORY_ITEM: "DELETE_HISTORY_ITEM",
  TOGGLE_PIN: "TOGGLE_PIN",
  GET_ENGINE_STATUS: "GET_ENGINE_STATUS",
  GET_RECENT_PAGES: "GET_RECENT_PAGES",
  CHROME_AI_SUMMARIZE: "CHROME_AI_SUMMARIZE",
};

export const SUMMARIZE_MODES = {
  PAGE: "page",
  SELECTION: "selection",
  YOUTUBE: "youtube",
};

export const CONTENT_SOURCE_TYPES = {
  ARTICLE: "article",
  YOUTUBE: "youtube",
  SELECTION: "selection",
};

export const YOUTUBE_ERRORS = {
  NO_CAPTIONS:
    "No transcript is available for this video. Try a video with captions or subtitles enabled.",
  PLAYER_NOT_READY:
    "YouTube is still loading this video. Wait a moment and try again.",
  CAPTION_FETCH_FAILED:
    "Could not download the transcript for this video. Captions may be restricted.",
  TRANSCRIPT_TOO_SHORT:
    "The transcript is too short to summarize. Try a longer video with captions.",
  NOT_YOUTUBE_WATCH: "Open a YouTube watch page to summarize a video.",
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

export const FEATURE_FLAGS = {
  YOUTUBE_TRANSCRIPTS: true,
  PDF_SUMMARIZATION: false,
  AI_PROVIDER_PLUGINS: false,
  OFFLINE_PACKAGED_MODELS: false,
};
