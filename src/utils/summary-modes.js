/**
 * Public API for summary modes — re-exports catalog from prompt config.
 * Synthesis lives in mode-synthesizer.js; prompts in config/summary-prompts.js.
 */
export {
  DEFAULT_SUMMARY_MODE,
  FREE_MODE_IDS,
  SUMMARY_MODES as SUMMARY_MODE_CATALOG,
  getAvailableModes,
  getModeDefinition as getSummaryModeById,
  isModeAvailable,
} from "../config/summary-prompts.js";

export { synthesizeForMode as summarizeLocallyWithMode } from "./mode-synthesizer.js";
export { extractContent } from "./content-extract.js";
