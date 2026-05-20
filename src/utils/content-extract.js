import {
  countWords,
  dedupeSentences,
  detectLanguage,
  detectSentiment,
  estimateReadingMinutes,
  splitSentences,
  tokenize,
  truncateSentence,
} from "./text.js";

const ACTION_PATTERNS = [
  /\b(should|must|need to|needs to|recommend|ensure|consider|try to|make sure)\b/i,
  /\b(step \d+|first,|second,|finally,|next,)\b/i,
  /\b(action item|to-do|todo|follow up|action:)\b/i,
];

function buildWordFrequency(sentences) {
  const frequencies = new Map();
  sentences.forEach((sentence) => {
    new Set(tokenize(sentence)).forEach((word) => {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    });
  });
  return frequencies;
}

function titleKeywords(title) {
  return new Set(tokenize(title || ""));
}

function scoreSentences(sentences, frequencies, titleWords) {
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
      score *= 1.3;
    }
    if (index > sentences.length - 4) {
      score *= 0.9;
    }
    if (sentence.length > 240) {
      score *= 0.82;
    }
    if (sentence.length < 80) {
      score *= 0.88;
    }

    const titleHits = words.filter((word) => titleWords.has(word)).length;
    score += titleHits * 0.35;

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

export function extractActionItems(sentences) {
  const matches = sentences.filter((sentence) =>
    ACTION_PATTERNS.some((pattern) => pattern.test(sentence)),
  );

  const unique = dedupeSentences(
    matches.map((s) => s.replace(/^[-•*\d.]+\s*/, "").trim()),
    0.75,
  );

  if (unique.length >= 2) {
    return unique.slice(0, 8);
  }

  const imperative = dedupeSentences(
    sentences.filter((s) =>
      /^(try|use|avoid|start|stop|check|review|update|create|build|learn|download|install)\b/i.test(
        s,
      ),
    ),
    0.75,
  ).slice(0, 6);

  if (imperative.length) {
    return imperative;
  }

  return [
    "Review the full article for supporting details and examples.",
    "Save or share the page if you will need it again later.",
  ];
}

/**
 * Rich sentence pools for mode-specific synthesis.
 * @param {object} payload
 */
export function extractContent(payload) {
  const title = payload.title || "Untitled";
  const rawSentences = splitSentences(payload.text || "");
  const sentences = dedupeSentences(rawSentences);

  if (sentences.length < 2) {
    const fallback = (payload.text || "").trim();
    return {
      title,
      sentences: [fallback],
      narrative: [fallback],
      highlights: [truncateSentence(fallback, 140)],
      implications: [truncateSentence(fallback, 140)],
      actions: extractActionItems([fallback]),
      sentiment: detectSentiment([fallback]),
      language: detectLanguage(payload.text, payload.language),
      readingTimeMinutes: estimateReadingMinutes(
        payload.wordCount || countWords(payload.text),
      ),
    };
  }

  const frequencies = buildWordFrequency(sentences);
  const titleWords = titleKeywords(title);
  const scored = scoreSentences(sentences, frequencies, titleWords);
  const used = new Set();

  const narrative = pickTop(
    scored,
    Math.min(8, Math.max(4, Math.ceil(sentences.length / 4))),
    used,
  ).map((i) => i.sentence);

  const highlights = pickTop(
    scored,
    Math.min(10, Math.max(5, Math.ceil(sentences.length / 3))),
    used,
  ).map((i) => truncateSentence(i.sentence, 140));

  const implications = pickTop(
    scored,
    Math.min(8, Math.max(4, Math.ceil(sentences.length / 4))),
    used,
  ).map((i) => truncateSentence(i.sentence, 160));

  const detail = pickTop(scored, Math.min(6, Math.ceil(sentences.length / 5)), used).map(
    (i) => truncateSentence(i.sentence, 200),
  );

  const shortLines = [...scored]
    .sort((a, b) => a.sentence.length - b.sentence.length)
    .slice(0, 12)
    .map((i) => truncateSentence(i.sentence, 100));

  if (!implications.length) {
    implications.push(...narrative.slice(0, 4).map((s) => truncateSentence(s, 160)));
  }
  if (!highlights.length) {
    highlights.push(...sentences.slice(0, 6).map((s) => truncateSentence(s, 140)));
  }
  if (!narrative.length) {
    narrative.push(...sentences.slice(0, 4));
  }

  return {
    title,
    sentences,
    narrative,
    highlights,
    implications,
    detail,
    shortLines,
    actions: extractActionItems(sentences),
    sentiment: detectSentiment(sentences),
    language: detectLanguage(payload.text, payload.language),
    readingTimeMinutes: estimateReadingMinutes(
      payload.wordCount || countWords(payload.text),
    ),
  };
}
