import { extractContent } from "./content-extract.js";
import { synthesizeForMode } from "./mode-synthesizer.js";
import { DEFAULT_SUMMARY_MODE } from "../config/summary-prompts.js";

export { extractContent, extractActionItems } from "./content-extract.js";

export function summarizeLocally(payload, modeId = DEFAULT_SUMMARY_MODE) {
  const extract = extractContent(payload);
  return synthesizeForMode(extract, modeId);
}
