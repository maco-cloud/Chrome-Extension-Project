import { getModeDefinition } from "../config/summary-prompts.js";
import { truncateSentence } from "./text.js";

const BEGINNER_REPLACEMENTS = [
  [/\butilize\b/gi, "use"],
  [/\bleverage\b/gi, "use"],
  [/\bfacilitate\b/gi, "help"],
  [/\bimplement\b/gi, "put in place"],
  [/\boptimize\b/gi, "improve"],
  [/\bstrategic\b/gi, "planned"],
  [/\bparadigm\b/gi, "model"],
  [/\bsynergy\b/gi, "teamwork"],
  [/\bnevertheless\b/gi, "still"],
  [/\bconsequently\b/gi, "so"],
  [/\bfurthermore\b/gi, "also"],
];

function simplifyText(text) {
  let out = text;
  BEGINNER_REPLACEMENTS.forEach(([pattern, replacement]) => {
    out = out.replace(pattern, replacement);
  });
  return out;
}

function joinSentences(parts, max = 5) {
  return parts.filter(Boolean).slice(0, max).join(" ");
}

function toBullets(lines, prefix = "") {
  return lines.map((line) => `${prefix}${line}`);
}

function synthesizeQuick(extract) {
  const sentences = extract.narrative.slice(0, 5);
  const summary = joinSentences(sentences, 5);
  return {
    tldr: truncateSentence(sentences[0] || summary, 120),
    summary,
    bullets: extract.highlights.slice(0, 4),
    takeaways: extract.implications.slice(0, 3),
    actionItems: extract.actions.slice(0, 3),
  };
}

function synthesizeBullets(extract) {
  const bullets = extract.highlights.slice(0, 9);
  return {
    tldr: truncateSentence(bullets[0] || extract.narrative[0], 100),
    summary: `Top points from “${extract.title}”:`,
    bullets,
    takeaways: [],
    actionItems: [],
  };
}

function synthesizeTakeaways(extract) {
  const source = extract.implications.length
    ? extract.implications
    : extract.highlights.length
      ? extract.highlights
      : extract.narrative;
  const takeaways = source.slice(0, 7).map((line, i) => {
    const prefixes = ["Insight", "Lesson", "Remember", "Apply", "Consider"];
    return `${prefixes[i % prefixes.length]}: ${line}`;
  });
  return {
    tldr: truncateSentence(takeaways[0], 120),
    summary: "Practical takeaways you can use:",
    bullets: [],
    takeaways,
    actionItems: extract.actions.slice(0, 2),
  };
}

function synthesizeStudy(extract) {
  const concepts = extract.implications.slice(0, 4);
  const details = extract.highlights.slice(0, 5);
  const summary = [
    "OVERVIEW",
    joinSentences(extract.narrative.slice(0, 2), 2),
    "",
    "KEY CONCEPTS",
    ...concepts.map((c) => `• ${c}`),
    "",
    "DETAILS TO REMEMBER",
    ...details.map((d) => `  – ${d}`),
    "",
    "REVIEW QUESTIONS",
    "• What is the main argument?",
    "• How would you explain this to someone else?",
  ].join("\n");

  return {
    tldr: truncateSentence(extract.narrative[0], 120),
    summary,
    bullets: [
      ...concepts.map((c) => `Concept: ${c}`),
      ...details.map((d) => `Detail: ${d}`),
    ].slice(0, 10),
    takeaways: concepts,
    actionItems: ["Re-read key sections and quiz yourself in 24 hours."],
  };
}

function synthesizeExecutive(extract) {
  const bluf = truncateSentence(extract.narrative[0], 160);
  const findings = extract.highlights.slice(0, 3);
  const summary = [
    "BOTTOM LINE",
    bluf,
    "",
    "CONTEXT",
    joinSentences(extract.narrative.slice(1, 3), 2),
    "",
    "KEY FINDINGS",
    ...findings.map((f, i) => `${i + 1}. ${f}`),
    "",
    "RECOMMENDATION",
    extract.actions[0] || "Review the full source before making decisions.",
  ].join("\n");

  return {
    tldr: bluf,
    summary,
    bullets: findings,
    takeaways: extract.implications.slice(0, 3),
    actionItems: extract.actions.slice(0, 3),
  };
}

function synthesizeActions(extract) {
  const tasks = [
    ...extract.actions,
    ...extract.highlights
      .filter((h) => /should|must|need|try|consider|recommend/i.test(h))
      .slice(0, 4),
  ].slice(0, 8);

  const checklist = tasks.map((t, i) => `[ ] ${i + 1}. ${t.replace(/^\[ \]\s*/, "")}`);

  return {
    tldr: `Next steps: ${truncateSentence(tasks[0] || "Review and prioritize actions", 80)}`,
    summary: "Priority action checklist:",
    bullets: checklist,
    takeaways: [],
    actionItems: tasks,
  };
}

function synthesizeBeginner(extract) {
  const simple = extract.narrative
    .slice(0, 4)
    .map((s) => simplifyText(truncateSentence(s, 180)));
  const summary = [
    "Here's the simple version:",
    "",
    ...simple.map((s, i) => `${i + 1}. ${s}`),
    "",
    "In plain terms: " + simplifyText(truncateSentence(extract.narrative[0], 140)),
  ].join("\n");

  return {
    tldr: simplifyText(truncateSentence(simple[0], 120)),
    summary,
    bullets: extract.shortLines.slice(0, 6).map((s) => simplifyText(s)),
    takeaways: extract.implications.slice(0, 4).map((s) => simplifyText(s)),
    actionItems: extract.actions.slice(0, 3).map((s) => simplifyText(s)),
  };
}

function synthesizeDetailed(extract) {
  const summary = [
    joinSentences(extract.narrative, 6),
    "",
    "Additional context:",
    joinSentences(extract.detail, 3),
    "",
    "Why it matters:",
    joinSentences(extract.implications.slice(0, 2), 2),
  ].join(" ");

  return {
    tldr: truncateSentence(extract.narrative[0], 130),
    summary,
    bullets: extract.highlights.slice(0, 10).map((b) => `Context: ${b}`),
    takeaways: extract.implications.slice(0, 6),
    actionItems: extract.actions.slice(0, 4),
  };
}

function synthesizeSocial(extract) {
  const hooks = [
    truncateSentence(extract.narrative[0], 200),
    truncateSentence(extract.highlights[0] || extract.narrative[1], 200),
    truncateSentence(extract.implications[0] || extract.highlights[1], 200),
    truncateSentence(extract.highlights[2] || extract.narrative[2], 200),
    truncateSentence(extract.actions[0] || extract.implications[1], 200),
    "What would you add? 👇",
  ].filter(Boolean);

  const thread = hooks.slice(0, 7).map((post, i) => `${i + 1}/ ${post}`);

  return {
    tldr: truncateSentence(thread[0], 120),
    summary: "Social thread draft:",
    bullets: thread,
    takeaways: [],
    actionItems: [],
  };
}

const SYNTHESIZERS = {
  quick: synthesizeQuick,
  bullets: synthesizeBullets,
  takeaways: synthesizeTakeaways,
  study: synthesizeStudy,
  executive: synthesizeExecutive,
  actions: synthesizeActions,
  beginner: synthesizeBeginner,
  detailed: synthesizeDetailed,
  social: synthesizeSocial,
};

/**
 * Build mode-specific summary output from extracted content pools.
 * @param {ReturnType<import('./content-extract.js').extractContent>} extract
 * @param {string} modeId
 */
export function synthesizeForMode(extract, modeId) {
  const mode = getModeDefinition(modeId);
  const synthesize = SYNTHESIZERS[mode.id] || synthesizeQuick;
  const core = synthesize(extract);
  const summary = (core.summary || "").trim();
  const tldr = (core.tldr || summary.slice(0, 120) || "").trim();

  return {
    ...core,
    summary: summary || tldr || "Summary could not be generated from this page.",
    tldr: tldr || summary.slice(0, 120) || "Summary unavailable.",
    summaryMode: mode.id,
    summaryModeLabel: mode.label,
    readingTimeMinutes: extract.readingTimeMinutes,
    sentiment: extract.sentiment,
    language: extract.language,
    engine: "local",
  };
}

/** Merge optional Chrome AI raw lines into extract pools before synthesis. */
export function enrichExtractWithAiLines(extract, aiLines) {
  if (!aiLines?.length) {
    return extract;
  }
  const extra = aiLines.filter((l) => l.length > 20);
  return {
    ...extract,
    highlights: dedupeLines([...extra, ...extract.highlights]).slice(0, 12),
    narrative: dedupeLines([...extra.slice(0, 2), ...extract.narrative]).slice(0, 8),
  };
}

function dedupeLines(lines) {
  const seen = new Set();
  return lines.filter((line) => {
    const key = line.toLowerCase().slice(0, 60);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
