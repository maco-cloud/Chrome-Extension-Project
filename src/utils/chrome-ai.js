import { MESSAGE_TYPES, OFFSCREEN_DOCUMENT_PATH } from "./constants.js";
import { summarizeLocally } from "./local-summarizer.js";

function getOffscreenUrl() {
  return chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
}

async function ensureOffscreenDocument() {
  const offscreenUrl = getOffscreenUrl();
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (contexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["WORKERS"],
    justification: "Use Chrome on-device AI summarizer when available on this device.",
  });
}

function requestChromeSummary(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPES.CHROME_AI_SUMMARIZE,
        text: payload.text,
        language: payload.language,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "Chrome AI summarization failed."));
          return;
        }
        resolve(response.data);
      },
    );
  });
}

export async function checkChromeAiAvailability() {
  try {
    await ensureOffscreenDocument();
    return await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CHROME_AI_STATUS" }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ available: false, reason: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { available: false, reason: "Unknown status" });
      });
    });
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

export async function summarizeWithChromeAi(payload) {
  await ensureOffscreenDocument();
  const result = await requestChromeSummary(payload);

  return {
    ...result,
    engine: "chrome-ai",
  };
}

export async function summarizeWithChromeAiOrLocal(payload) {
  try {
    return await summarizeWithChromeAi(payload);
  } catch {
    return summarizeLocally(payload);
  }
}
