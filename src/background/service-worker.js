import {
 CONTENT_SOURCE_TYPES,
 MAX_CONTENT_CHARS,
 MAX_HISTORY_ITEMS,
 MIN_CONTENT_CHARS,
 MIN_SELECTION_CHARS,
 MESSAGE_TYPES,
 SESSION_KEYS,
 SUMMARIZE_MODES,
 YOUTUBE_ERRORS,
} from "../utils/constants.js";
import { activateLicense, clearLicense, getLicenseSummary } from "../utils/license.js";
import { checkChromeAiAvailability } from "../utils/chrome-ai.js";
import {
  getCachedExtraction,
  setCachedExtraction,
} from "../utils/extraction-cache.js";
import {
  assertCanSummarize,
  getEntitlementState,
  incrementDailyUsage,
} from "../utils/entitlements.js";
import { summarizeContent } from "../utils/summarizer.js";
import { isModeAvailable } from "../utils/summary-modes.js";
import {
  addHistoryEntry,
  clearHistory,
  deleteHistoryItem,
  getHistory,
  getRecentPages,
  getSettings,
  saveSummaryMode,
  toggleHistoryPin,
  trackRecentPage,
} from "../utils/storage.js";
import { isUnsupportedUrl, truncateText } from "../utils/url.js";
import { countWords } from "../utils/text.js";
import { isYouTubeWatchUrl } from "../utils/youtube.js";
import { toUserMessage } from "../utils/user-messages.js";

let summarizeInFlight = null;

function mapYouTubeError(code, fallback) {
 return YOUTUBE_ERRORS[code] || fallback || YOUTUBE_ERRORS.NO_CAPTIONS;
}

function mapError(error) {
  const message = error?.message || "";
  if (Object.values(YOUTUBE_ERRORS).includes(message)) {
    return message;
  }
  return toUserMessage(error, "Could not summarize this page. Refresh the page and try again.");
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

async function extractYouTubeContent(tab) {
 const cached = getCachedExtraction(tab.id, tab.url);
 if (cached) {
 return cached;
 }

 let injectionResult;
 try {
 injectionResult = await chrome.scripting.executeScript({
 target: { tabId: tab.id },
 files: ["src/content/youtube-extractor.js"],
 });
 } catch (error) {
 throw new Error(mapError(error));
 }

 const [{ result }] = injectionResult;

 if (!result?.ok) {
 throw new Error(
 mapYouTubeError(result?.error, result?.message),
 );
 }

 const text = truncateText(result.text, MAX_CONTENT_CHARS);
 const extracted = {
 title: result.title || tab.title || "YouTube video",
 url: result.url || tab.url,
 text,
 segments: result.segments || [],
 videoId: result.videoId,
 sourceType: CONTENT_SOURCE_TYPES.YOUTUBE,
 wordCount: result.wordCount,
 characterCount: text.length,
 readingTimeMinutes: result.readingTimeMinutes,
 language: result.language || "en",
 };

 setCachedExtraction(tab.id, tab.url, extracted);
 return extracted;
}

async function extractTabContent(tab) {
 if (isUnsupportedUrl(tab.url)) {
 throw new Error(
 "This page cannot be summarized. Open a regular website and try again.",
 );
 }

 if (isYouTubeWatchUrl(tab.url)) {
 return extractYouTubeContent(tab);
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
 sourceType: CONTENT_SOURCE_TYPES.ARTICLE,
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
 sourceType: summaryResult.sourceType || extracted.sourceType,
 videoId: extracted.videoId || summaryResult.videoId || null,
 characterCount: extracted.characterCount,
 readingTimeMinutes: summaryResult.readingTimeMinutes,
 tldr: summaryResult.tldr,
 summary: summaryResult.summary,
 bullets: summaryResult.bullets,
 takeaways: summaryResult.takeaways,
 actionItems: summaryResult.actionItems,
 keyMoments: summaryResult.keyMoments || [],
 sentiment: summaryResult.sentiment,
 language: summaryResult.language,
 engine: summaryResult.engine,
 summaryMode: summaryResult.summaryMode,
 preview: truncateText(summaryResult.tldr || summaryResult.summary, 140),
 };
}

async function runSummarize({ mode = SUMMARIZE_MODES.PAGE, selectedText = "" } = {}) {
  if (summarizeInFlight) {
    return summarizeInFlight;
  }

  summarizeInFlight = (async () => {
    await assertCanSummarize();
    const [settings, entitlements] = await Promise.all([
      getSettings(),
      getEntitlementState(),
    ]);

    if (!isModeAvailable(settings.summaryMode, entitlements.isPro)) {
      throw new Error("This summary mode requires Lifetime Pro.");
    }

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
 sourceType: CONTENT_SOURCE_TYPES.SELECTION,
 wordCount: countWords(selection),
 characterCount: selection.length,
 readingTimeMinutes: Math.max(1, Math.round(countWords(selection) / 225)),
 language: "en",
 };
    } else {
      extracted = await extractTabContent(tab);
      await trackRecentPage({ url: extracted.url, title: extracted.title });
    }

    const summaryResult = await summarizeContent(
      extracted,
      settings.summaryEngine,
      settings.summaryMode,
    );
    const payload = buildPayload(extracted, summaryResult);

    const entAfterUsage = await incrementDailyUsage().then(async () =>
      getEntitlementState(),
    );

    if (entAfterUsage.canSaveHistory) {
      const maxHistory = entAfterUsage.isPro
        ? MAX_HISTORY_ITEMS
        : entAfterUsage.historyLimit;
      await addHistoryEntry(payload, maxHistory);
    }

    return { ...payload, entitlements: entAfterUsage };
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message?.type === MESSAGE_TYPES.CHROME_AI_SUMMARIZE ||
    message?.type === "CHROME_AI_STATUS"
  ) {
    return false;
  }

  const run = async () => {
    switch (message?.type) {
 case MESSAGE_TYPES.SUMMARIZE: {
        const payload = await runSummarize({ mode: SUMMARIZE_MODES.PAGE });
        const fromExtensionUi = sender?.url?.includes("/popup/");
        if (!fromExtensionUi) {
          await openPopupWithResult(payload, null);
        }
        return payload;
      }
      case MESSAGE_TYPES.SUMMARIZE_SELECTION: {
        const payload = await runSummarize({ mode: SUMMARIZE_MODES.SELECTION });
        const fromExtensionUi = sender?.url?.includes("/popup/");
        if (!fromExtensionUi) {
          await openPopupWithResult(payload, null);
        }
        return payload;
      }
 case MESSAGE_TYPES.GET_PAGE_CONTEXT: {
 const tab = await getActiveTab();
 return {
 isYouTube: isYouTubeWatchUrl(tab.url),
 url: tab.url || "",
 title: tab.title || "",
 };
 }
 case MESSAGE_TYPES.GET_SETTINGS:
        return getSettings();
      case MESSAGE_TYPES.GET_ENTITLEMENTS:
        return getEntitlementState();
      case MESSAGE_TYPES.SET_SUMMARY_MODE:
        await saveSummaryMode(message.modeId);
        return getSettings();
      case MESSAGE_TYPES.ACTIVATE_LICENSE:
        return activateLicense(message.licenseKey || "");
      case MESSAGE_TYPES.DEACTIVATE_LICENSE:
        await clearLicense();
        return { ok: true };
      case MESSAGE_TYPES.GET_LICENSE:
        return getLicenseSummary();
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
