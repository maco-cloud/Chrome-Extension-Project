import { MESSAGE_TYPES, WORDS_PER_MINUTE } from "../utils/constants.js";
import { summarizeLocally } from "../utils/local-summarizer.js";

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function parseBullets(text) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((line) => line.length > 12);
}

async function getSummarizer() {
  if (typeof Summarizer === "undefined") {
    throw new Error("Chrome on-device Summarizer API is not available.");
  }

  const availability = await Summarizer.availability();
  if (availability === "unavailable") {
    throw new Error("Chrome on-device AI is unavailable on this device.");
  }

  return Summarizer.create({
    type: "key-points",
    format: "markdown",
    length: "medium",
  });
}

async function summarizeWithChromeAi(text) {
  const summarizer = await getSummarizer();
  const output = await summarizer.summarize(text);
  if (typeof summarizer.destroy === "function") {
    await summarizer.destroy();
  }

  const bullets = parseBullets(output);
  const summary = bullets.slice(0, 2).join(" ") || output.trim();
  const takeaways = bullets.length ? bullets.slice(0, 6) : [summary];
  const readingTimeMinutes = Math.max(1, Math.round(countWords(text) / WORDS_PER_MINUTE));

  const localExtras = summarizeLocally({
    text,
    wordCount: countWords(text),
  });

  return {
    summary,
    takeaways,
    actionItems: localExtras.actionItems,
    readingTimeMinutes,
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

    Summarizer.availability()
      .then((status) => {
        sendResponse({
          available: status === "available" || status === "readily",
          reason:
            status === "available" || status === "readily"
              ? "Ready"
              : `Status: ${status}`,
          status,
        });
      })
      .catch((error) => {
        sendResponse({ available: false, reason: error.message });
      });
    return;
  }

  if (message?.type === MESSAGE_TYPES.CHROME_AI_SUMMARIZE) {
    summarizeWithChromeAi(message.text)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) =>
        sendResponse({ ok: false, error: error.message || "Chrome AI failed." }),
      );
    return true;
  }

  return false;
});
