import {
  MAX_HISTORY_ITEMS,
  STORAGE_KEYS,
  SUMMARY_ENGINES,
} from "./constants.js";

export async function getFromStorage(keys) {
  return chrome.storage.local.get(keys);
}

export async function setInStorage(items) {
  return chrome.storage.local.set(items);
}

export async function getSettings() {
  const data = await getFromStorage([
    STORAGE_KEYS.SUMMARY_ENGINE,
    STORAGE_KEYS.DARK_MODE,
  ]);
  return {
    summaryEngine: data[STORAGE_KEYS.SUMMARY_ENGINE] || SUMMARY_ENGINES.AUTO,
    darkMode: Boolean(data[STORAGE_KEYS.DARK_MODE]),
  };
}

export async function saveSummaryEngine(engine) {
  await setInStorage({ [STORAGE_KEYS.SUMMARY_ENGINE]: engine });
}

export async function saveDarkMode(enabled) {
  await setInStorage({ [STORAGE_KEYS.DARK_MODE]: Boolean(enabled) });
}

export async function getHistory() {
  const data = await getFromStorage([STORAGE_KEYS.HISTORY]);
  return Array.isArray(data[STORAGE_KEYS.HISTORY])
    ? data[STORAGE_KEYS.HISTORY]
    : [];
}

export async function addHistoryEntry(entry) {
  const history = await getHistory();
  const next = [
    {
      id: crypto.randomUUID(),
      title: entry.title,
      url: entry.url,
      preview: entry.preview,
      summary: entry.summary,
      takeaways: entry.takeaways,
      actionItems: entry.actionItems,
      readingTimeMinutes: entry.readingTimeMinutes,
      characterCount: entry.characterCount,
      engine: entry.engine,
      timestamp: Date.now(),
    },
    ...history.filter((item) => item.url !== entry.url),
  ].slice(0, MAX_HISTORY_ITEMS);

  await setInStorage({ [STORAGE_KEYS.HISTORY]: next });
  return next;
}

export async function clearHistory() {
  await setInStorage({ [STORAGE_KEYS.HISTORY]: [] });
  return [];
}

export async function deleteHistoryItem(id) {
  const history = await getHistory();
  const next = history.filter((item) => item.id !== id);
  await setInStorage({ [STORAGE_KEYS.HISTORY]: next });
  return next;
}
