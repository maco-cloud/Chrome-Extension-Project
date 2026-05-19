import { WORDS_PER_MINUTE } from "./constants.js";

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "when", "at", "by", "for",
  "with", "about", "into", "through", "during", "before", "after", "to", "from",
  "in", "out", "on", "off", "over", "under", "again", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "of", "as",
  "it", "its", "this", "that", "these", "those", "i", "you", "he", "she", "we",
  "they", "them", "not", "no", "so", "than", "too", "very", "can", "will", "just",
]);

const POSITIVE_WORDS = new Set([
  "good", "great", "excellent", "positive", "success", "successful", "benefit",
  "improve", "growth", "win", "best", "love", "happy", "strong", "effective",
]);

const NEGATIVE_WORDS = new Set([
  "bad", "poor", "negative", "fail", "failure", "risk", "problem", "issue",
  "worse", "worst", "hate", "weak", "concern", "danger", "crisis", "difficult",
]);

export function countWords(text) {
  return (text || "").split(/\s+/).filter(Boolean).length;
}

export function estimateReadingMinutes(wordCount) {
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

export function splitSentences(text) {
  return (text || "")
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 30);
}

export function tokenize(sentence) {
  return (sentence || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

export function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) {
    return 0;
  }
  let intersection = 0;
  setA.forEach((word) => {
    if (setB.has(word)) {
      intersection += 1;
    }
  });
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

export function dedupeSentences(sentences, threshold = 0.62) {
  const unique = [];
  sentences.forEach((sentence) => {
    const isDuplicate = unique.some(
      (existing) => jaccardSimilarity(existing, sentence) >= threshold,
    );
    if (!isDuplicate) {
      unique.push(sentence);
    }
  });
  return unique;
}

export function detectLanguage(text, htmlLang) {
  if (htmlLang) {
    return htmlLang.split("-")[0].toLowerCase();
  }

  const sample = (text || "").slice(0, 1200).toLowerCase();
  const scores = {
    en: (sample.match(/\b(the|and|that|with|for|this)\b/g) || []).length,
    es: (sample.match(/\b(el|la|de|que|con|para|por)\b/g) || []).length,
    fr: (sample.match(/\b(le|la|de|et|que|pour|avec)\b/g) || []).length,
    de: (sample.match(/\b(der|die|das|und|mit|für|nicht)\b/g) || []).length,
  };

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 2 ? best[0] : "en";
}

export function detectSentiment(sentences) {
  let positive = 0;
  let negative = 0;

  sentences.forEach((sentence) => {
    const words = tokenize(sentence);
    words.forEach((word) => {
      if (POSITIVE_WORDS.has(word)) {
        positive += 1;
      }
      if (NEGATIVE_WORDS.has(word)) {
        negative += 1;
      }
    });
  });

  if (positive > 0 && negative > 0) {
    return "mixed";
  }
  if (positive > negative * 1.2) {
    return "positive";
  }
  if (negative > positive * 1.2) {
    return "negative";
  }
  return "neutral";
}

export function truncateSentence(text, max = 140) {
  const trimmed = (text || "").trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1).trim()}…`;
}
