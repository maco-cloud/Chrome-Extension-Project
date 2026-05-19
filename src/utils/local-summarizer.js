import { WORDS_PER_MINUTE } from "./constants.js";

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at",
  "by", "for", "with", "about", "against", "between", "into", "through",
  "during", "before", "after", "above", "below", "to", "from", "up", "down",
  "in", "out", "on", "off", "over", "under", "again", "further", "once",
  "here", "there", "all", "any", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "can", "will", "just", "don", "should", "now",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "of", "as", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "them", "his", "her",
  "our", "your", "their", "what", "which", "who", "whom", "how", "why",
]);

const ACTION_PATTERNS = [
  /\b(should|must|need to|needs to|recommend|ensure|consider|try to|make sure)\b/i,
  /\b(step \d+|first,|second,|finally,|next,)\b/i,
  /\b(action item|to-do|todo|follow up)\b/i,
];

function tokenize(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 35);
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function scoreSentences(sentences) {
  const frequencies = new Map();

  sentences.forEach((sentence) => {
    const unique = new Set(tokenize(sentence));
    unique.forEach((word) => {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    });
  });

  return sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    if (!words.length) {
      return { sentence, score: 0, index };
    }

    let score = 0;
    words.forEach((word) => {
      score += frequencies.get(word) || 0;
    });
    score /= words.length;

    if (index < 2) {
      score *= 1.25;
    }
    if (sentence.length > 220) {
      score *= 0.85;
    }

    return { sentence, score, index };
  });
}

function pickTop(scored, count, usedIndices) {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const picked = [];

  for (const item of sorted) {
    if (picked.length >= count) {
      break;
    }
    if (usedIndices.has(item.index)) {
      continue;
    }
    picked.push(item);
    usedIndices.add(item.index);
  }

  return picked.sort((a, b) => a.index - b.index);
}

function extractActionItems(sentences) {
  const matches = sentences.filter((sentence) =>
    ACTION_PATTERNS.some((pattern) => pattern.test(sentence)),
  );

  const unique = [];
  const seen = new Set();

  matches.forEach((sentence) => {
    const normalized = sentence.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    unique.push(sentence.replace(/^[-•*\d.]+\s*/, "").trim());
  });

  if (unique.length >= 2) {
    return unique.slice(0, 5);
  }

  const imperative = sentences
    .filter((s) => /^(try|use|avoid|start|stop|check|review|update|create|build|learn)\b/i.test(s))
    .slice(0, 4);

  if (imperative.length) {
    return imperative;
  }

  return [
    "Skim the full article for context around these highlights.",
    "Bookmark the page if you plan to revisit the details later.",
  ];
}

function toTakeawayBullets(sentences) {
  return sentences.map((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed.length <= 140) {
      return trimmed;
    }
    return `${trimmed.slice(0, 137).trim()}…`;
  });
}

export function summarizeLocally(payload) {
  const sentences = splitSentences(payload.text);

  if (sentences.length < 2) {
    const fallback = payload.text.trim();
    return {
      summary: fallback,
      takeaways: [fallback],
      actionItems: extractActionItems([fallback]),
      readingTimeMinutes: Math.max(
        1,
        Math.round(countWords(payload.text) / WORDS_PER_MINUTE),
      ),
      engine: "local",
    };
  }

  const scored = scoreSentences(sentences);
  const used = new Set();
  const summaryPicks = pickTop(scored, Math.min(4, Math.ceil(sentences.length / 4)), used);
  const takeawayPicks = pickTop(scored, Math.min(6, Math.ceil(sentences.length / 3)), used);

  const summary = summaryPicks.map((item) => item.sentence).join(" ");
  const takeaways = toTakeawayBullets(
    takeawayPicks.length ? takeawayPicks.map((i) => i.sentence) : summaryPicks.map((i) => i.sentence),
  );
  const actionItems = extractActionItems(sentences);
  const readingTimeMinutes = Math.max(
    1,
    Math.round((payload.wordCount || countWords(payload.text)) / WORDS_PER_MINUTE),
  );

  return {
    summary,
    takeaways,
    actionItems,
    readingTimeMinutes,
    engine: "local",
  };
}
