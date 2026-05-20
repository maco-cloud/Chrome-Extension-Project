import {
  MAX_HISTORY_ITEMS,
  MAX_RECENT_PAGES,
  STORAGE_KEYS,
  SUMMARY_ENGINES,
} from "./constants.js";
import { DEFAULT_SUMMARY_MODE } from "./summary-modes.js";

export async function getFromStorage(keys) {
  return chrome.storage.local.get(keys);
}

export async function setInStorage(items) {
  return chrome.storage.local.set(items);
}

export async function getSettings() {
  const data = await getFromStorage([
    STORAGE_KEYS.SUMMARY_ENGINE,
    STORAGE_KEYS.SUMMARY_MODE,
    STORAGE_KEYS.DARK_MODE,
  ]);
  return {
    summaryEngine: data[STORAGE_KEYS.SUMMARY_ENGINE] || SUMMARY_ENGINES.AUTO,
    summaryMode: data[STORAGE_KEYS.SUMMARY_MODE] || DEFAULT_SUMMARY_MODE,
    darkMode:
      data[STORAGE_KEYS.DARK_MODE] !== undefined
        ? Boolean(data[STORAGE_KEYS.DARK_MODE])
        : true,
  };
}

export async function saveSummaryMode(modeId) {
  await setInStorage({ [STORAGE_KEYS.SUMMARY_MODE]: modeId });
}

export async function saveSummaryEngine(engine) {
  await setInStorage({ [STORAGE_KEYS.SUMMARY_ENGINE]: engine });
}

export async function saveDarkMode(enabled) {
  await setInStorage({ [STORAGE_KEYS.DARK_MODE]: Boolean(enabled) });
}

export async function getHistory() {
  const data = await getFromStorage([STORAGE_KEYS.HISTORY]);
  const history = Array.isArray(data[STORAGE_KEYS.HISTORY])
    ? data[STORAGE_KEYS.HISTORY]
    : [];
  return sortHistory(history);
}

function sortHistory(history) {
  return [...history].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
}

export async function addHistoryEntry(entry, maxItems = MAX_HISTORY_ITEMS) {
  const history = await getHistory();
  const cap = Number.isFinite(maxItems) ? maxItems : MAX_HISTORY_ITEMS;
  const next = [
    {
      id: crypto.randomUUID(),
      title: entry.title,
      url: entry.url,
      preview: entry.preview,
      tldr: entry.tldr,
      summary: entry.summary,
      bullets: entry.bullets,
      takeaways: entry.takeaways,
      actionItems: entry.actionItems,
      readingTimeMinutes: entry.readingTimeMinutes,
      characterCount: entry.characterCount,
      sentiment: entry.sentiment,
      language: entry.language,
      engine: entry.engine,
      pinned: false,
      timestamp: Date.now(),
    },
    ...history.filter((item) => item.url !== entry.url),
  ].slice(0, cap);

  await setInStorage({ [STORAGE_KEYS.HISTORY]: next });
  return sortHistory(next);
}

export async function toggleHistoryPin(id) {
  const history = await getHistory();
  const next = history.map((item) =>
    item.id === id ? { ...item, pinned: !item.pinned } : item,
  );
  await setInStorage({ [STORAGE_KEYS.HISTORY]: next });
  return sortHistory(next);
}

export async function clearHistory() {
  await setInStorage({ [STORAGE_KEYS.HISTORY]: [] });
  return [];
}

export async function deleteHistoryItem(id) {
  const history = await getHistory();
  const next = history.filter((item) => item.id !== id);
  await setInStorage({ [STORAGE_KEYS.HISTORY]: next });
  return sortHistory(next);
}

export async function getRecentPages() {
  const data = await getFromStorage([STORAGE_KEYS.RECENT_PAGES]);
  return Array.isArray(data[STORAGE_KEYS.RECENT_PAGES])
    ? data[STORAGE_KEYS.RECENT_PAGES]
    : [];
}

export async function trackRecentPage(page) {
  const recent = await getRecentPages();
  const next = [
    {
      url: page.url,
      title: page.title,
      timestamp: Date.now(),
    },
    ...recent.filter((item) => item.url !== page.url),
  ].slice(0, MAX_RECENT_PAGES);

  await setInStorage({ [STORAGE_KEYS.RECENT_PAGES]: next });
  return next;
}
