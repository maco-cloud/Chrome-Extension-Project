import { EXTRACTION_CACHE_TTL_MS } from "./constants.js";

const cache = new Map();

function cacheKey(tabId, url) {
  return `${tabId}:${url || ""}`;
}

export function getCachedExtraction(tabId, url) {
  const key = cacheKey(tabId, url);
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > EXTRACTION_CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedExtraction(tabId, url, data) {
  const key = cacheKey(tabId, url);
  cache.set(key, { data, timestamp: Date.now() });

  if (cache.size > 30) {
    const oldest = [...cache.entries()].sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    )[0];
    if (oldest) {
      cache.delete(oldest[0]);
    }
  }
}

export function clearExtractionCache() {
  cache.clear();
}
