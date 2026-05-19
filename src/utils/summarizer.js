import { SUMMARY_ENGINES } from "./constants.js";
import { summarizeWithChromeAi, summarizeWithChromeAiOrLocal } from "./chrome-ai.js";
import { summarizeLocally } from "./local-summarizer.js";

export function normalizeSummaryResult(result, payload) {
  return {
    tldr: result.tldr || result.summary?.slice(0, 120) || "",
    summary: result.summary || "",
    bullets: result.bullets?.length ? result.bullets : result.takeaways || [],
    takeaways: result.takeaways || [],
    actionItems: result.actionItems || [],
    readingTimeMinutes: result.readingTimeMinutes || 1,
    sentiment: result.sentiment || "neutral",
    language: result.language || payload.language || "en",
    engine: result.engine || "local",
  };
}

export async function summarizeContent(payload, enginePreference = SUMMARY_ENGINES.AUTO) {
  let result;

  switch (enginePreference) {
    case SUMMARY_ENGINES.LOCAL:
      result = summarizeLocally(payload);
      break;
    case SUMMARY_ENGINES.CHROME_AI:
      result = await summarizeWithChromeAiOrLocal(payload);
      break;
    case SUMMARY_ENGINES.AUTO:
    default:
      result = await summarizeWithChromeAiOrLocal(payload);
      break;
  }

  return normalizeSummaryResult(result, payload);
}
