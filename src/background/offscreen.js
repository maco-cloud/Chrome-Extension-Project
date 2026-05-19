import {
  MESSAGE_TYPES,
  normalizeSummarizerOutputLanguage,
} from "../utils/constants.js";
import { summarizeLocally } from "../utils/local-summarizer.js";
import { countWords } from "../utils/text.js";

function parseBullets(text) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((line) => line.length > 12);
}

function buildSummarizerOptions(language) {
  const outputLanguage = normalizeSummarizerOutputLanguage(language);
  return {
    type: "key-points",
    format: "markdown",
    length: "medium",
    outputLanguage,
  };
}

async function getSummarizer(language = "en") {
  if (typeof Summarizer === "undefined") {
    throw new Error("Chrome on-device Summarizer API is not available.");
  }

  const options = buildSummarizerOptions(language);
  const availability = await Summarizer.availability(options);
  if (availability === "unavailable") {
    throw new Error("Chrome on-device AI is unavailable on this device.");
  }

  return Summarizer.create(options);
}

async function summarizeWithChromeAi(text, language = "en") {
  const summarizer = await getSummarizer(language);
  const output = await summarizer.summarize(text);
  if (typeof summarizer.destroy === "function") {
    await summarizer.destroy();
  }

  const bullets = parseBullets(output);
  const summary = bullets.slice(0, 2).join(" ") || output.trim();
  const takeaways = bullets.length ? bullets.slice(0, 6) : [summary];
  const outputLanguage = normalizeSummarizerOutputLanguage(language);
  const local = summarizeLocally({
    text,
    wordCount: countWords(text),
    language: outputLanguage,
  });

  return {
    tldr: local.tldr || summary.slice(0, 120),
    summary,
    bullets: bullets.length ? bullets : local.bullets,
    takeaways,
    actionItems: local.actionItems,
    readingTimeMinutes: local.readingTimeMinutes,
    sentiment: local.sentiment,
    language: outputLanguage,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CHROME_AI_STATUS") {
    if (typeof Summarizer === "undefined") {
      sendResponse({
        available: false,
        reason: "Requires Chrome 138+ with on-device AI enabled.",
      });
      return;
    }

    const statusOptions = buildSummarizerOptions("en");
    Summarizer.availability(statusOptions)
      .then((status) => {
        sendResponse({
          available: status === "available" || status === "readily",
          reason:
            status === "available" || status === "readily"
              ? "Ready"
              : `Status: ${status}`,
          status,
          outputLanguage: statusOptions.outputLanguage,
        });
      })
      .catch((error) => {
        sendResponse({ available: false, reason: error.message });
      });
    return;
  }

  if (message?.type === MESSAGE_TYPES.CHROME_AI_SUMMARIZE) {
    summarizeWithChromeAi(message.text, message.language)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) =>
        sendResponse({ ok: false, error: error.message || "Chrome AI failed." }),
      );
    return true;
  }

  return false;
});
