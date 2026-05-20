import { CONTENT_SOURCE_TYPES, SUMMARY_ENGINES } from "./constants.js";
import { DEFAULT_SUMMARY_MODE } from "../config/summary-prompts.js";
import { summarizeWithChromeAiOrLocal } from "./chrome-ai.js";
import { extractContent } from "./content-extract.js";
import { synthesizeForMode } from "./mode-synthesizer.js";
import { summarizeLocally } from "./local-summarizer.js";
import {
  mergeYouTubeEnhancements,
  summarizeYouTubeLocally,
} from "./youtube-summarizer.js";

function isYouTubePayload(payload) {
  return payload?.sourceType === CONTENT_SOURCE_TYPES.YOUTUBE;
}

export function normalizeSummaryResult(result, payload) {
  const summary = (result.summary || "").trim();
  const tldr = (result.tldr || summary.slice(0, 120) || "").trim();

  return {
    tldr: tldr || "Summary unavailable for this page.",
    summary: summary || tldr || "Could not generate a summary. Try another page or mode.",
    bullets: result.bullets?.length ? result.bullets : [],
    takeaways: result.takeaways || [],
    actionItems: result.actionItems || [],
    keyMoments: result.keyMoments || [],
    readingTimeMinutes: result.readingTimeMinutes || 1,
    sentiment: result.sentiment || "neutral",
    language: result.language || payload.language || "en",
    engine: result.engine || "local",
    usedFallback: Boolean(result.usedFallback),
    summaryMode: result.summaryMode || null,
    summaryModeLabel: result.summaryModeLabel || null,
    sourceType: result.sourceType || payload.sourceType || CONTENT_SOURCE_TYPES.ARTICLE,
    videoId: payload.videoId || result.videoId || null,
  };
}

function applyModeToYouTubeBase(base, payload, modeId) {
  const extract = extractContent(payload);
  const merged = {
    ...extract,
    narrative: base.summary ? [base.summary, ...extract.narrative] : extract.narrative,
    highlights: base.bullets?.length ? [...base.bullets, ...extract.highlights] : extract.highlights,
    implications: base.takeaways?.length
      ? [...base.takeaways, ...extract.implications]
      : extract.implications,
    actions: base.actionItems?.length ? base.actionItems : extract.actions,
  };
  const synthesized = synthesizeForMode(merged, modeId);
  return {
    ...synthesized,
    keyMoments: base.keyMoments || [],
    engine: base.engine || "local",
    usedFallback: Boolean(base.usedFallback),
  };
}

async function summarizeYouTubeContent(payload, enginePreference, summaryModeId) {
  const runLocal = () => {
    const base = summarizeYouTubeLocally(payload);
    return applyModeToYouTubeBase(mergeYouTubeEnhancements(base, payload), payload, summaryModeId);
  };

  if (enginePreference === SUMMARY_ENGINES.LOCAL) {
    return runLocal();
  }

  try {
    const aiResult = await summarizeWithChromeAiOrLocal(payload, summaryModeId);
    return applyModeToYouTubeBase(mergeYouTubeEnhancements(aiResult, payload), payload, summaryModeId);
  } catch {
    return runLocal();
  }
}

export async function summarizeContent(
  payload,
  enginePreference = SUMMARY_ENGINES.AUTO,
  summaryModeId = DEFAULT_SUMMARY_MODE,
) {
  if (isYouTubePayload(payload)) {
    const result = await summarizeYouTubeContent(payload, enginePreference, summaryModeId);
    return normalizeSummaryResult(result, payload);
  }

  let result;

  switch (enginePreference) {
    case SUMMARY_ENGINES.LOCAL:
      result = summarizeLocally(payload, summaryModeId);
      result = { ...result, engine: "local", usedFallback: false };
      break;
    case SUMMARY_ENGINES.CHROME_AI:
    case SUMMARY_ENGINES.AUTO:
    default:
      result = await summarizeWithChromeAiOrLocal(payload, summaryModeId);
      break;
  }

  return normalizeSummaryResult(result, payload);
}
