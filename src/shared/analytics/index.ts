import { STORAGE_KEYS } from '../constants';
import type { AnalyticsPayload } from '../types';
import { getFromStorage, setInStorage } from '../storage';

interface AnalyticsStore {
  events: AnalyticsPayload[];
  toneCounts: Record<string, number>;
  upgradeClicks: number;
}

const MAX_EVENTS = 200;

async function getStore(): Promise<AnalyticsStore> {
  return (
    (await getFromStorage<AnalyticsStore>(STORAGE_KEYS.analytics)) ?? {
      events: [],
      toneCounts: {},
      upgradeClicks: 0,
    }
  );
}

export async function trackEvent(payload: AnalyticsPayload): Promise<void> {
  const store = await getStore();
  store.events = [...store.events.slice(-(MAX_EVENTS - 1)), payload];

  if (payload.event === 'generation' && payload.tone) {
    store.toneCounts[payload.tone] = (store.toneCounts[payload.tone] ?? 0) + 1;
  }
  if (payload.event === 'upgrade_click') {
    store.upgradeClicks += 1;
  }

  await setInStorage(STORAGE_KEYS.analytics, store);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  if (API_BASE) {
    fetch(`${API_BASE}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ts: Date.now() }),
    }).catch(() => {});
  }
}

export async function getAnalyticsSummary(): Promise<AnalyticsStore> {
  return getStore();
}
