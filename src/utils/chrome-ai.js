import { MESSAGE_TYPES, OFFSCREEN_DOCUMENT_PATH } from "./constants.js";
import { DEFAULT_SUMMARY_MODE } from "../config/summary-prompts.js";
import { extractContent } from "./content-extract.js";
import { enrichExtractWithAiLines, synthesizeForMode } from "./mode-synthesizer.js";
import { summarizeLocally } from "./local-summarizer.js";

const CHROME_AI_TIMEOUT_MS = 22000;

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

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), ms);
    }),
  ]);
}

function requestChromeSummary(payload, summaryModeId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPES.CHROME_AI_SUMMARIZE,
        text: payload.text,
        title: payload.title,
        language: payload.language,
        summaryMode: summaryModeId,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error("PORT_CLOSED"));
          return;
        }
        if (!response?.ok) {
          reject(new Error("AI_UNAVAILABLE"));
          return;
        }
        resolve(response.data);
      },
    );
  });
}

function parseAiLines(raw) {
  if (!raw) {
    return [];
  }
  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((line) => line.length > 12);
}

async function summarizeWithChromeAiForMode(payload, summaryModeId = DEFAULT_SUMMARY_MODE) {
  await ensureOffscreenDocument();
  const aiRaw = await withTimeout(
    requestChromeSummary(payload, summaryModeId),
    CHROME_AI_TIMEOUT_MS,
  );
  const extract = extractContent(payload);
  const aiLines = parseAiLines(aiRaw.rawText || aiRaw.summary);
  const enriched = enrichExtractWithAiLines(extract, aiLines);
  const result = synthesizeForMode(enriched, summaryModeId);
  return { ...result, engine: "chrome-ai", usedFallback: false };
}

function summarizeLocallyFallback(payload, summaryModeId) {
  const result = summarizeLocally(payload, summaryModeId);
  return { ...result, engine: "local", usedFallback: true };
}

export async function summarizeWithChromeAiOrLocal(
  payload,
  summaryModeId = DEFAULT_SUMMARY_MODE,
) {
  try {
    return await summarizeWithChromeAiForMode(payload, summaryModeId);
  } catch {
    return summarizeLocallyFallback(payload, summaryModeId);
  }
}

export async function checkChromeAiAvailability() {
  try {
    await ensureOffscreenDocument();
    const status = await withTimeout(
      new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "CHROME_AI_STATUS" }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ available: false, reason: "unavailable" });
            return;
          }
          resolve(response || { available: false, reason: "unavailable" });
        });
      }),
      8000,
    );

    if (status.available) {
      return { available: true, reason: "ready" };
    }
    return { available: false, reason: "unavailable" };
  } catch {
    return { available: false, reason: "unavailable" };
  }
}

export async function summarizeWithChromeAi(payload) {
  return summarizeWithChromeAiOrLocal(payload, DEFAULT_SUMMARY_MODE);
}
