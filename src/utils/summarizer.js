import { SUMMARY_ENGINES } from "./constants.js";
import { summarizeWithChromeAi, summarizeWithChromeAiOrLocal } from "./chrome-ai.js";
import { summarizeLocally } from "./local-summarizer.js";

export async function summarizeContent(payload, enginePreference = SUMMARY_ENGINES.AUTO) {
  switch (enginePreference) {
    case SUMMARY_ENGINES.LOCAL:
      return summarizeLocally(payload);
    case SUMMARY_ENGINES.CHROME_AI:
      return summarizeWithChromeAiOrLocal(payload);
    case SUMMARY_ENGINES.AUTO:
    default:
      return summarizeWithChromeAiOrLocal(payload);
  }
}
