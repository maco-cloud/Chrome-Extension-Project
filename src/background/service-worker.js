import {
  MAX_CONTENT_CHARS,
  MIN_CONTENT_CHARS,
  MESSAGE_TYPES,
} from "../utils/constants.js";
import { summarizeWithOpenAI } from "../utils/openai.js";
import {
  addHistoryEntry,
  clearHistory,
  deleteHistoryItem,
  getHistory,
  getSettings,
} from "../utils/storage.js";
import { isUnsupportedUrl, truncateText } from "../utils/url.js";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }
  return tab;
}

async function extractTabContent(tab) {
  if (isUnsupportedUrl(tab.url)) {
    throw new Error(
      "This page cannot be summarized. Open a regular website and try again.",
    );
  }

  let injectionResult;
  try {
    injectionResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content/extractor.js"],
    });
  } catch {
    throw new Error(
      "Unable to access this page. Try a standard website tab (not PDF or restricted pages).",
    );
  }

  const [{ result }] = injectionResult;

  if (!result?.text || result.characterCount < MIN_CONTENT_CHARS) {
    throw new Error(
      "Not enough readable content on this page. Try an article or blog post.",
    );
  }

  const text = truncateText(result.text, MAX_CONTENT_CHARS);

  return {
    title: result.title || tab.title || "Untitled page",
    url: result.url || tab.url,
    text,
    wordCount: result.wordCount,
    characterCount: text.length,
    readingTimeMinutes: result.readingTimeMinutes,
  };
}

async function handleSummarize() {
  const settings = await getSettings();
  const tab = await getActiveTab();
  const extracted = await extractTabContent(tab);
  const aiResult = await summarizeWithOpenAI(settings.apiKey, extracted);

  const payload = {
    title: extracted.title,
    url: extracted.url,
    characterCount: extracted.characterCount,
    readingTimeMinutes: aiResult.readingTimeMinutes,
    summary: aiResult.summary,
    takeaways: aiResult.takeaways,
    actionItems: aiResult.actionItems,
    preview: truncateText(aiResult.summary, 140),
  };

  await addHistoryEntry(payload);
  return payload;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const run = async () => {
    switch (message?.type) {
      case MESSAGE_TYPES.SUMMARIZE:
        return handleSummarize();
      case MESSAGE_TYPES.GET_SETTINGS:
        return getSettings();
      case MESSAGE_TYPES.GET_HISTORY:
        return getHistory();
      case MESSAGE_TYPES.CLEAR_HISTORY:
        return clearHistory();
      case MESSAGE_TYPES.DELETE_HISTORY_ITEM:
        return deleteHistoryItem(message.id);
      default:
        throw new Error("Unknown message type.");
    }
  };

  run()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error?.message || "Something went wrong.",
      }),
    );

  return true;
});
