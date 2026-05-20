import { FREE_DAILY_LIMIT, FREE_TONES } from '../constants';
import type { GenerateRequest, SubscriptionState, ToneId, UsageState } from '../types';

export function isPremium(sub: SubscriptionState): boolean {
  return sub.plan === 'premium' && (sub.status === 'active' || sub.status === 'trialing');
}

export function canUseTone(tone: ToneId, sub: SubscriptionState): boolean {
  if (isPremium(sub)) return true;
  return FREE_TONES.has(tone);
}

export function dailyLimit(sub: SubscriptionState, usage: UsageState): number {
  if (isPremium(sub)) return Infinity;
  return FREE_DAILY_LIMIT + usage.bonusGenerations;
}

export function remainingGenerations(
  sub: SubscriptionState,
  usage: UsageState,
): number {
  const limit = dailyLimit(sub, usage);
  if (!Number.isFinite(limit)) return Infinity;
  return Math.max(0, limit - usage.generationsToday);
}

export function canGenerate(
  sub: SubscriptionState,
  usage: UsageState,
  req: Pick<GenerateRequest, 'tone'>,
): { allowed: boolean; reason?: string } {
  if (!canUseTone(req.tone, sub)) {
    return { allowed: false, reason: 'This tone is Premium. Upgrade to unlock all tones.' };
  }
  const remaining = remainingGenerations(sub, usage);
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Daily limit reached (${FREE_DAILY_LIMIT}/day on Free). Upgrade for unlimited.`,
    };
  }
  return { allowed: true };
}
