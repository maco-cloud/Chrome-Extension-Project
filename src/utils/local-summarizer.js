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

function extractActionItems(sentences) {
  const matches = sentences.filter((sentence) =>
    ACTION_PATTERNS.some((pattern) => pattern.test(sentence)),
  );

  const unique = dedupeSentences(
    matches.map((s) => s.replace(/^[-•*\d.]+\s*/, "").trim()),
    0.75,
  );

  if (unique.length >= 2) {
    return unique.slice(0, 6);
  }

  const imperative = dedupeSentences(
    sentences.filter((s) =>
      /^(try|use|avoid|start|stop|check|review|update|create|build|learn|download|install)\b/i.test(
        s,
      ),
    ),
    0.75,
  ).slice(0, 5);

  if (imperative.length) {
    return imperative;
  }

  return [
    "Review the full article for supporting details and examples.",
    "Save or share the page if you will need it again later.",
  ];
}

function buildTldr(summarySentence, sentences) {
  const candidate =
    summarySentence ||
    sentences.find((s) => s.length > 50 && s.length < 180) ||
    sentences[0] ||
    "";
  return truncateSentence(candidate, 120);
}

function normalizeSummaryResult(base, payload) {
  const language = detectLanguage(payload.text, payload.language);
  const readingTimeMinutes = estimateReadingMinutes(
    payload.wordCount || countWords(payload.text),
  );

  return {
    tldr: base.tldr,
    summary: base.summary,
    bullets: base.bullets,
    takeaways: base.takeaways,
    actionItems: base.actionItems,
    readingTimeMinutes,
    sentiment: base.sentiment,
    language,
    engine: "local",
  };
}

export function summarizeLocally(payload) {
  const rawSentences = splitSentences(payload.text);
  const sentences = dedupeSentences(rawSentences);

  if (sentences.length < 2) {
    const fallback = (payload.text || "").trim();
    const sentiment = detectSentiment([fallback]);
    return normalizeSummaryResult(
      {
        tldr: buildTldr(fallback, [fallback]),
        summary: fallback,
        bullets: [truncateSentence(fallback, 160)],
        takeaways: [truncateSentence(fallback, 160)],
        actionItems: extractActionItems([fallback]),
        sentiment,
      },
      payload,
    );
  }

  const frequencies = buildWordFrequency(sentences);
  const titleWords = titleKeywords(payload.title);
  const scored = scoreSentences(sentences, frequencies, titleWords);
  const used = new Set();

  const summaryCount = Math.min(4, Math.max(2, Math.ceil(sentences.length / 5)));
  const takeawayCount = Math.min(6, Math.max(3, Math.ceil(sentences.length / 4)));
  const bulletCount = Math.min(8, Math.max(4, Math.ceil(sentences.length / 3)));

  const summaryPicks = pickTop(scored, summaryCount, used);
  const takeawayPicks = pickTop(scored, takeawayCount, used);
  const bulletPicks = pickTop(scored, bulletCount, used);

  const summary = summaryPicks.map((item) => item.sentence).join(" ");
  const takeaways = takeawayPicks.map((item) =>
    truncateSentence(item.sentence, 150),
  );
  const bullets = bulletPicks.map((item) =>
    truncateSentence(item.sentence, 130),
  );
  const actionItems = extractActionItems(sentences);
  const sentiment = detectSentiment(sentences);
  const tldr = buildTldr(summaryPicks[0]?.sentence, sentences);

  return normalizeSummaryResult(
    {
      tldr,
      summary,
      bullets,
      takeaways,
      actionItems,
      sentiment,
    },
    payload,
  );
}
