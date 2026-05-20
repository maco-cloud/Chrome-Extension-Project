/**
 * Summary mode definitions: catalog metadata + AI instruction prompts + synthesis profile.
 * Local engine uses synthesis profiles; Chrome on-device AI uses instruction prompts prepended to input.
 */

/** @typedef {'free'|'pro'} ModeTier */

/**
 * @typedef {Object} SummaryModeDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {ModeTier} tier
 * @property {string} icon
 * @property {string} systemPrompt
 * @property {string} outputShape
 */

export const SUMMARY_MODES = [
  {
    id: "quick",
    label: "Quick Summary",
    description: "Fast 3–5 sentence overview",
    tier: "free",
    icon: "⚡",
    outputShape: "short-paragraph",
    systemPrompt: `You are QuickDigest AI in QUICK SUMMARY mode.
Write a concise overview in 3–5 clear sentences.
Lead with the main point. No bullet lists. Plain, direct language.
Optimize for speed reading.`,
  },
  {
    id: "bullets",
    label: "Bullet Points",
    description: "Scannable high-signal bullets only",
    tier: "free",
    icon: "•",
    outputShape: "bullets-only",
    systemPrompt: `You are QuickDigest AI in BULLET POINTS mode.
Output ONLY a tight bullet list (6–10 bullets).
Each bullet = one important fact. No intro paragraph. Highly scannable.
Skip minor details.`,
  },
  {
    id: "takeaways",
    label: "Key Takeaways",
    description: "Practical insights and lessons",
    tier: "free",
    icon: "◎",
    outputShape: "takeaways",
    systemPrompt: `You are QuickDigest AI in KEY TAKEAWAYS mode.
Focus on practical insights, lessons learned, and what a reader should remember.
Use numbered takeaways. Emphasize actionable learning, not plot recap.`,
  },
  {
    id: "study",
    label: "Study Notes",
    description: "Structured notes for memorization",
    tier: "pro",
    icon: "📚",
    outputShape: "study-notes",
    systemPrompt: `You are QuickDigest AI in STUDY NOTES mode.
Create structured educational notes with clear headings (Overview, Key Concepts, Details, Review Questions).
Use sub-bullets. Optimize for memorization and exam review.`,
  },
  {
    id: "executive",
    label: "Executive Brief",
    description: "Decision-ready business briefing",
    tier: "pro",
    icon: "◆",
    outputShape: "executive-brief",
    systemPrompt: `You are QuickDigest AI in EXECUTIVE BRIEF mode.
Write a professional briefing: BLUF (bottom line up front), Context, Key Findings, Recommendation.
Strategic tone. Decision-focused. Under 200 words in the main brief.`,
  },
  {
    id: "actions",
    label: "Action Items",
    description: "Checklist of next steps",
    tier: "pro",
    icon: "✓",
    outputShape: "action-checklist",
    systemPrompt: `You are QuickDigest AI in ACTION ITEMS mode.
Output a prioritized checklist of next steps only.
Start with highest-impact actions. Use checkbox-style lines. No long prose.`,
  },
  {
    id: "beginner",
    label: "Beginner Explanation",
    description: "Simple language, minimal jargon",
    tier: "pro",
    icon: "💡",
    outputShape: "beginner",
    systemPrompt: `You are QuickDigest AI in BEGINNER EXPLANATION mode.
Explain the content in simple everyday language. Define jargon briefly.
Short sentences. Friendly tone. Assume the reader is new to the topic.`,
  },
  {
    id: "detailed",
    label: "Detailed Analysis",
    description: "Deeper context and nuance",
    tier: "pro",
    icon: "🔍",
    outputShape: "deep-analysis",
    systemPrompt: `You are QuickDigest AI in DETAILED ANALYSIS mode.
Provide expanded context, deeper explanations, and nuanced interpretation.
Cover causes, implications, tradeoffs, and open questions. Longer than a quick summary.`,
  },
  {
    id: "social",
    label: "Social Media Thread",
    description: "Punchy posts for X/LinkedIn",
    tier: "pro",
    icon: "🐦",
    outputShape: "social-thread",
    systemPrompt: `You are QuickDigest AI in SOCIAL MEDIA THREAD mode.
Write a short thread (5–7 posts). Each post under 280 characters.
Hook first. Punchy. Engaging. No hashtag spam. Label posts 1/, 2/, etc.`,
  },
];

export const DEFAULT_SUMMARY_MODE = "quick";

export const FREE_MODE_IDS = new Set(["quick", "bullets", "takeaways"]);

export function getModeDefinition(modeId) {
  return SUMMARY_MODES.find((m) => m.id === modeId) || SUMMARY_MODES[0];
}

export function isModeAvailable(modeId, isPro) {
  const mode = getModeDefinition(modeId);
  return mode.tier === "free" || isPro;
}

export function getAvailableModes(isPro) {
  return SUMMARY_MODES.filter((m) => isModeAvailable(m.id, isPro));
}

/** Prep article text with mode-specific AI instructions for Chrome Summarizer. */
export function buildAiInputWithPrompt(payload, modeId) {
  const mode = getModeDefinition(modeId);
  const title = payload.title ? `Title: ${payload.title}\n\n` : "";
  return `${mode.systemPrompt}\n\n---\n${title}${payload.text || ""}`;
}

/** Map Chrome Summarizer length hint from mode. */
export function getAiLengthHint(modeId) {
  switch (modeId) {
    case "quick":
    case "beginner":
      return "short";
    case "bullets":
    case "actions":
    case "social":
      return "short";
    case "detailed":
    case "study":
      return "long";
    default:
      return "medium";
  }
}
