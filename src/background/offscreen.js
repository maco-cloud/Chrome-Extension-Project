import {
  MESSAGE_TYPES,
  normalizeSummarizerOutputLanguage,
} from "../utils/constants.js";
import {
  buildAiInputWithPrompt,
  getAiLengthHint,
  getModeDefinition,
} from "../config/summary-prompts.js";

function buildSummarizerOptions(language, modeId) {
  const outputLanguage = normalizeSummarizerOutputLanguage(language);
  const length = getAiLengthHint(modeId);
  return {
    type: "key-points",
    format: "markdown",
    length,
    outputLanguage,
  };
}

async function getSummarizer(language = "en", modeId = "quick") {
  if (typeof Summarizer === "undefined") {
    throw new Error("AI_UNAVAILABLE");
  }

  const options = buildSummarizerOptions(language, modeId);
  const availability = await Summarizer.availability(options);
  if (availability === "unavailable") {
    throw new Error("AI_UNAVAILABLE");
  }

  return Summarizer.create(options);
}

async function summarizeWithChromeAi(text, language = "en", modeId = "quick", title = "") {
  const summarizer = await getSummarizer(language, modeId);
  const input = buildAiInputWithPrompt({ text, title, language }, modeId);
  let output = "";
  try {
    output = await summarizer.summarize(input);
  } finally {
    if (typeof summarizer.destroy === "function") {
      try {
        await summarizer.destroy();
      } catch {
        // ignore cleanup errors
      }
    }
  }

  const mode = getModeDefinition(modeId);
  return {
    rawText: (output || "").trim(),
    summary: (output || "").trim(),
    summaryMode: mode.id,
    summaryModeLabel: mode.label,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CHROME_AI_STATUS") {
    if (typeof Summarizer === "undefined") {
      sendResponse({ available: false, reason: "unavailable" });
      return;
    }

    const statusOptions = buildSummarizerOptions("en", "quick");
    Summarizer.availability(statusOptions)
      .then((status) => {
        sendResponse({
          available: status === "available" || status === "readily",
          reason: status === "available" || status === "readily" ? "ready" : "unavailable",
        });
      })
      .catch(() => {
        sendResponse({ available: false, reason: "unavailable" });
      });
    return;
  }

  if (message?.type === MESSAGE_TYPES.CHROME_AI_SUMMARIZE) {
    summarizeWithChromeAi(message.text, message.language, message.summaryMode, message.title)
      .then((data) => sendResponse({ ok: true, data }))
      .catch(() => sendResponse({ ok: false, error: "AI_UNAVAILABLE" }));
    return true;
  }

  return false;
});
