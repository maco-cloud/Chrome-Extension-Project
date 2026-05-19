import { CONTENT_SOURCE_TYPES, SUMMARY_ENGINES } from "./constants.js";
import { summarizeWithChromeAi, summarizeWithChromeAiOrLocal } from "./chrome-ai.js";
import { summarizeLocally } from "./local-summarizer.js";
import {
  mergeYouTubeEnhancements,
  summarizeYouTubeLocally,
} from "./youtube-summarizer.js";

function isYouTubePayload(payload) {
  return payload?.sourceType === CONTENT_SOURCE_TYPES.YOUTUBE;
}

export function normalizeSummaryResult(result, payload) {
  return {
    tldr: result.tldr || result.summary?.slice(0, 120) || "",
    summary: result.summary || "",
    bullets: result.bullets?.length ? result.bullets : result.takeaways || [],
    takeaways: result.takeaways || [],
    actionItems: result.actionItems || [],
    keyMoments: result.keyMoments || [],
    readingTimeMinutes: result.readingTimeMinutes || 1,
    sentiment: result.sentiment || "neutral",
    language: result.language || payload.language || "en",
    engine: result.engine || "local",
    sourceType: result.sourceType || payload.sourceType || CONTENT_SOURCE_TYPES.ARTICLE,
    videoId: payload.videoId || result.videoId || null,
  };
}

async function summarizeYouTubeContent(payload, enginePreference) {
  switch (enginePreference) {
    case SUMMARY_ENGINES.LOCAL:
      return summarizeYouTubeLocally(payload);
    case SUMMARY_ENGINES.CHROME_AI: {
      try {
        const aiResult = await summarizeWithChromeAi(payload);
        return mergeYouTubeEnhancements(aiResult, payload);
      } catch {
        return summarizeYouTubeLocally(payload);
      }
    }
    case SUMMARY_ENGINES.AUTO:
    default: {
      try {
        const aiResult = await summarizeWithChromeAi(payload);
        return mergeYouTubeEnhancements(aiResult, payload);
      } catch {
        return summarizeYouTubeLocally(payload);
      }
    }
  }
}

export async function summarizeContent(payload, enginePreference = SUMMARY_ENGINES.AUTO) {
  if (isYouTubePayload(payload)) {
    const result = await summarizeYouTubeContent(payload, enginePreference);
    return normalizeSummaryResult(result, payload);
  }

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
