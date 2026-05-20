import { STORAGE_KEYS } from '../constants';
import { generateReferralCode, setInStorage } from '../storage';
import type { UserProfile } from '../types';

export async function mockLogin(email: string): Promise<UserProfile> {
  const user: UserProfile = {
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    displayName: email.split('@')[0],
    referralCode: generateReferralCode(),
  };
  await setInStorage(STORAGE_KEYS.user, user);
  return user;
}

export async function mockLogout(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.user);
}

export async function applyReferralCode(code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized.startsWith('ARA-') || normalized.length < 8) return false;
  const user = await chrome.storage.local.get(STORAGE_KEYS.user);
  const profile = user[STORAGE_KEYS.user] as UserProfile | undefined;
  if (!profile || profile.referredBy) return false;
  if (profile.referralCode.toUpperCase() === normalized) return false;
  profile.referredBy = normalized;
  await setInStorage(STORAGE_KEYS.user, profile);
  return true;
}
