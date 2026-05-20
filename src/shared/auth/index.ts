/**
 * Auth facade — swap mock implementation for Supabase when backend is live.
 */
import { mockLogin, mockLogout } from './mock-auth';
import type { UserProfile } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON);
}

export async function signIn(email: string): Promise<UserProfile> {
  if (isAuthConfigured()) {
    // TODO: Supabase signInWithOtp / magic link
    console.info('[AI Reply Anywhere] Supabase configured — wire auth in src/shared/auth/supabase.ts');
  }
  return mockLogin(email);
}

export async function signOut(): Promise<void> {
  if (isAuthConfigured()) {
    // TODO: Supabase signOut
  }
  await mockLogout();
}
