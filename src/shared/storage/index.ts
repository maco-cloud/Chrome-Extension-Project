import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';
import type {
  AppSettings,
  ExtensionState,
  SubscriptionState,
  UsageState,
  UserProfile,
} from '../types';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultUsage(): UsageState {
  return {
    dateKey: todayKey(),
    generationsToday: 0,
    bonusGenerations: 0,
    totalGenerations: 0,
  };
}

function defaultSubscription(): SubscriptionState {
  return { plan: 'free', status: 'none' };
}

export async function getFromStorage<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

export async function setInStorage<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getUsage(): Promise<UsageState> {
  let usage = await getFromStorage<UsageState>(STORAGE_KEYS.usage);
  if (!usage) {
    usage = defaultUsage();
    await setInStorage(STORAGE_KEYS.usage, usage);
    return usage;
  }
  if (usage.dateKey !== todayKey()) {
    usage = {
      ...usage,
      dateKey: todayKey(),
      generationsToday: 0,
    };
    await setInStorage(STORAGE_KEYS.usage, usage);
  }
  return usage;
}

export async function incrementUsage(): Promise<UsageState> {
  const usage = await getUsage();
  usage.generationsToday += 1;
  usage.totalGenerations += 1;
  await setInStorage(STORAGE_KEYS.usage, usage);
  return usage;
}

export async function addBonusGenerations(count: number): Promise<UsageState> {
  const usage = await getUsage();
  usage.bonusGenerations += count;
  await setInStorage(STORAGE_KEYS.usage, usage);
  return usage;
}

export async function getSubscription(): Promise<SubscriptionState> {
  const sub =
    (await getFromStorage<SubscriptionState>(STORAGE_KEYS.subscription)) ??
    defaultSubscription();
  if (sub.mockPremium) {
    return { ...sub, plan: 'premium', status: 'active' };
  }
  return sub;
}

export async function getSettings(): Promise<AppSettings> {
  return (
    (await getFromStorage<AppSettings>(STORAGE_KEYS.settings)) ?? {
      ...DEFAULT_SETTINGS,
    }
  );
}

export async function getUser(): Promise<UserProfile | null> {
  return (await getFromStorage<UserProfile>(STORAGE_KEYS.user)) ?? null;
}

export async function getExtensionState(): Promise<ExtensionState> {
  const [user, usage, subscription, settings] = await Promise.all([
    getUser(),
    getUsage(),
    getSubscription(),
    getSettings(),
  ]);
  return { user, usage, subscription, settings };
}

export function generateReferralCode(): string {
  const part = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `ARA-${part}`;
}
