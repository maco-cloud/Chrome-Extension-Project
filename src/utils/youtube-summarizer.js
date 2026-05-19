import { summarizeLocally } from "./local-summarizer.js";
import { tokenize, truncateSentence } from "./text.js";
import { buildYouTubeTimestampUrl, formatTimestamp } from "./youtube.js";

function scoreSegment(segment, frequencies, titleWords, index, total) {
  const words = tokenize(segment.text);
  if (!words.length) {
    return 0;
  }

  let score = 0;
  words.forEach((word) => {
    score += frequencies.get(word) || 0;
  });
  score /= words.length;

  const titleHits = words.filter((word) => titleWords.has(word)).length;
  score += titleHits * 0.4;

  if (segment.text.length > 40 && segment.text.length < 220) {
    score *= 1.15;
  }
  if (segment.text.length > 260) {
    score *= 0.85;
  }

  const position = index / Math.max(total - 1, 1);
  if (position < 0.12) {
    score *= 1.1;
  }
  if (position > 0.88) {
    score *= 1.05;
  }

  return score;
}

function mergeNearbySegments(segments, gapMs = 12000) {
  if (!segments.length) {
    return [];
  }

  const merged = [];
  let current = { ...segments[0], text: segments[0].text };

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    const gap = segment.startMs - (current.startMs + current.durationMs);

    if (gap <= gapMs && (current.text.length + segment.text.length) < 260) {
      current.text = `${current.text} ${segment.text}`.trim();
      current.durationMs = segment.startMs + segment.durationMs - current.startMs;
      continue;
    }

    merged.push(current);
    current = { ...segment };
  }

  merged.push(current);
  return merged;
}

export function buildKeyMoments(payload, maxCount = 6) {
  const segments = mergeNearbySegments(payload.segments || []);
  if (!segments.length) {
    return [];
  }

  const frequencies = new Map();
  segments.forEach((segment) => {
    new Set(tokenize(segment.text)).forEach((word) => {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    });
  });

  const titleWords = new Set(tokenize(payload.title || ""));
  const scored = segments
    .map((segment, index) => ({
      segment,
      score: scoreSegment(segment, frequencies, titleWords, index, segments.length),
    }))
    .sort((a, b) => b.score - a.score);

  const usedStarts = new Set();
  const moments = [];

  for (const item of scored) {
    if (moments.length >= maxCount) {
      break;
    }

    const bucket = Math.floor(item.segment.startMs / 15000);
    if (usedStarts.has(bucket)) {
      continue;
    }

    usedStarts.add(bucket);
    moments.push({
      timestamp: formatTimestamp(item.segment.startMs),
      startMs: item.segment.startMs,
      label: truncateSentence(item.segment.text, 120),
      url: buildYouTubeTimestampUrl(payload.url, item.segment.startMs),
    });
  }

  return moments.sort((a, b) => a.startMs - b.startMs);
}

export function summarizeYouTubeLocally(payload) {
  const base = summarizeLocally(payload);
  const keyMoments = buildKeyMoments(payload);

  return {
    ...base,
    keyMoments,
    sourceType: "youtube",
    engine: base.engine || "local",
  };
}

export function mergeYouTubeEnhancements(aiResult, payload) {
  const enhanced = summarizeYouTubeLocally(payload);
  return {
    ...aiResult,
    keyMoments: enhanced.keyMoments,
    sourceType: "youtube",
    readingTimeMinutes:
      aiResult.readingTimeMinutes || enhanced.readingTimeMinutes,
  };
}
