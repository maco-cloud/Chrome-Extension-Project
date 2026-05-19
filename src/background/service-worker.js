import {
  MAX_CONTENT_CHARS,
  MIN_CONTENT_CHARS,
  MIN_SELECTION_CHARS,
  MESSAGE_TYPES,
  SESSION_KEYS,
  SUMMARIZE_MODES,
} from "../utils/constants.js";
import { checkChromeAiAvailability } from "../utils/chrome-ai.js";
import {
  getCachedExtraction,
  setCachedExtraction,
} from "../utils/extraction-cache.js";
import { summarizeContent } from "../utils/summarizer.js";
import {
  addHistoryEntry,
  clearHistory,
  deleteHistoryItem,
  getHistory,
  getRecentPages,
  getSettings,
  toggleHistoryPin,
  trackRecentPage,
} from "../utils/storage.js";
import { isUnsupportedUrl, truncateText } from "../utils/url.js";
import { countWords } from "../utils/text.js";

let summarizeInFlight = null;

function mapError(error) {
  const message = error?.message || "Something went wrong.";

  if (message.includes("Cannot access contents of")) {
    return "This page is restricted (try a normal website tab, not incognito-restricted pages).";
  }
  if (message.includes("Extensions cannot access")) {
    return "Extensions cannot access this page type.";
  }
  return message;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }
  return tab;
}

async function readSelectedText(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection()?.toString() || "",
  });
  return (result || "").trim();
}

async function extractTabContent(tab) {
  if (isUnsupportedUrl(tab.url)) {
    throw new Error(
      "This page cannot be summarized. Open a regular website and try again.",
    );
  }

  const cached = getCachedExtraction(tab.id, tab.url);
  if (cached) {
    return cached;
  }

  let injectionResult;
  try {
    injectionResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content/extractor.js"],
    });
  } catch (error) {
    throw new Error(mapError(error));
  }

  const [{ result }] = injectionResult;

  if (!result?.text || result.characterCount < MIN_CONTENT_CHARS) {
    throw new Error(
      "Not enough readable content on this page. Try an article or blog post.",
    );
  }

  const text = truncateText(result.text, MAX_CONTENT_CHARS);
  const extracted = {
    title: result.title || tab.title || "Untitled page",
    url: result.url || tab.url,
    text,
    wordCount: result.wordCount,
    characterCount: text.length,
    readingTimeMinutes: result.readingTimeMinutes,
    language: result.language || "en",
  };

  setCachedExtraction(tab.id, tab.url, extracted);
  return extracted;
}

function buildPayload(extracted, summaryResult) {
  return {
    title: extracted.title,
    url: extracted.url,
    characterCount: extracted.characterCount,
    readingTimeMinutes: summaryResult.readingTimeMinutes,
    tldr: summaryResult.tldr,
    summary: summaryResult.summary,
    bullets: summaryResult.bullets,
    takeaways: summaryResult.takeaways,
    actionItems: summaryResult.actionItems,
    sentiment: summaryResult.sentiment,
    language: summaryResult.language,
    engine: summaryResult.engine,
    preview: truncateText(summaryResult.tldr || summaryResult.summary, 140),
  };
}

async function runSummarize({ mode = SUMMARIZE_MODES.PAGE, selectedText = "" } = {}) {
  if (summarizeInFlight) {
    return summarizeInFlight;
  }

  summarizeInFlight = (async () => {
    const settings = await getSettings();
    const tab = await getActiveTab();

    let extracted;

    if (mode === SUMMARIZE_MODES.SELECTION) {
      const selection = selectedText || (await readSelectedText(tab.id));
      if (selection.length < MIN_SELECTION_CHARS) {
        throw new Error("Select more text to summarize (at least a few sentences).");
      }

      extracted = {
        title: `${tab.title || "Selection"} (selection)`,
        url: tab.url || "",
        text: truncateText(selection, MAX_CONTENT_CHARS),
        wordCount: countWords(selection),
        characterCount: selection.length,
        readingTimeMinutes: Math.max(1, Math.round(countWords(selection) / 225)),
        language: "en",
      };
    } else {
      extracted = await extractTabContent(tab);
      await trackRecentPage({ url: extracted.url, title: extracted.title });
    }

    const summaryResult = await summarizeContent(extracted, settings.summaryEngine);
    const payload = buildPayload(extracted, summaryResult);
    await addHistoryEntry(payload);
    return payload;
  })();

  try {
    return await summarizeInFlight;
  } finally {
    summarizeInFlight = null;
  }
}

async function storePopupPayload(payload, error) {
  await chrome.storage.session.set({
    [SESSION_KEYS.POPUP_PAYLOAD]: {
      payload,
      error,
      timestamp: Date.now(),
    },
  });
}

async function openPopupWithResult(payload, error) {
  await storePopupPayload(payload, error);
  try {
    await chrome.action.openPopup();
  } catch {
    // Popup may already be open or unsupported in this context.
  }
}

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "qd-summarize-page",
      title: "Summarize page with QuickDigest AI",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "qd-summarize-selection",
      title: "Summarize selection with QuickDigest AI",
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) {
    return;
  }

  try {
    if (info.menuItemId === "qd-summarize-page") {
      const payload = await runSummarize({ mode: SUMMARIZE_MODES.PAGE });
      await openPopupWithResult(payload, null);
    }
    if (info.menuItemId === "qd-summarize-selection") {
      const payload = await runSummarize({
        mode: SUMMARIZE_MODES.SELECTION,
        selectedText: info.selectionText || "",
      });
      await openPopupWithResult(payload, null);
    }
  } catch (error) {
    await openPopupWithResult(null, mapError(error));
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  try {
    if (command === "summarize-page") {
      const payload = await runSummarize({ mode: SUMMARIZE_MODES.PAGE });
      await openPopupWithResult(payload, null);
      return;
    }
    if (command === "summarize-selection") {
      const payload = await runSummarize({ mode: SUMMARIZE_MODES.SELECTION });
      await openPopupWithResult(payload, null);
    }
  } catch (error) {
    await openPopupWithResult(null, mapError(error));
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    message?.type === MESSAGE_TYPES.CHROME_AI_SUMMARIZE ||
    message?.type === "CHROME_AI_STATUS"
  ) {
    return false;
  }

  const run = async () => {
    switch (message?.type) {
      case MESSAGE_TYPES.SUMMARIZE:
        return runSummarize({ mode: SUMMARIZE_MODES.PAGE });
      case MESSAGE_TYPES.SUMMARIZE_SELECTION:
        return runSummarize({ mode: SUMMARIZE_MODES.SELECTION });
      case MESSAGE_TYPES.GET_SETTINGS:
        return getSettings();
      case MESSAGE_TYPES.GET_HISTORY:
        return getHistory();
      case MESSAGE_TYPES.GET_RECENT_PAGES:
        return getRecentPages();
      case MESSAGE_TYPES.CLEAR_HISTORY:
        return clearHistory();
      case MESSAGE_TYPES.DELETE_HISTORY_ITEM:
        return deleteHistoryItem(message.id);
      case MESSAGE_TYPES.TOGGLE_PIN:
        return toggleHistoryPin(message.id);
      case MESSAGE_TYPES.GET_ENGINE_STATUS:
        return checkChromeAiAvailability();
      default:
        throw new Error("Unknown message type.");
    }
  };

  run()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: mapError(error),
      }),
    );

  return true;
});
