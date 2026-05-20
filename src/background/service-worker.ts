import { AiClient } from '../shared/api/ai-client';
import { withThrottle } from '../shared/api/throttle';
import { getAnalyticsSummary, trackEvent } from '../shared/analytics';
import { applyReferralCode } from '../shared/auth/mock-auth';
import { signIn, signOut } from '../shared/auth';
import { openCheckout } from '../shared/billing/stripe';
import { SIGNATURE } from '../shared/constants';
import { canGenerate, remainingGenerations } from '../shared/entitlements';
import { onMessage } from '../shared/messaging';
import {
  addBonusGenerations,
  getExtensionState,
  getUser,
  incrementUsage,
  setInStorage,
} from '../shared/storage';
import { STORAGE_KEYS, REFERRAL_BONUS } from '../shared/constants';
import type { GenerateRequest, GenerateResponse, SubscriptionState } from '../shared/types';

const aiClient = new AiClient({
  getAuthToken: async () => {
    const user = await getUser();
    return user?.id ?? null;
  },
});

onMessage({
  async GET_STATE() {
    return getExtensionState();
  },

  async GET_ANALYTICS() {
    return getAnalyticsSummary();
  },

  async GENERATE_REPLY(message) {
    const req = message.payload as GenerateRequest;
    const state = await getExtensionState();

    const gate = canGenerate(state.subscription, state.usage, req);
    if (!gate.allowed) {
      throw new Error(gate.reason);
    }

    const customPrompt = state.settings.customPrompts[req.tone]?.trim();
    const enriched: GenerateRequest = {
      ...req,
      includeSignature: state.settings.showSignature,
      customPrompt: customPrompt || undefined,
      maxTokens: state.settings.generationMaxTokens,
    };

    const response = await withThrottle(() => aiClient.generate(enriched));

    let text = response.text;

    const showWatermark =
      state.subscription.plan === 'free' && state.settings.showSignature;
    if (showWatermark && req.includeSignature !== false) {
      text += SIGNATURE;
    }

    await incrementUsage();
    await trackEvent({
      event: 'generation',
      tone: req.tone,
      siteHost: req.siteHost,
    });

    const sub = await getExtensionState();
    const remaining = remainingGenerations(sub.subscription, sub.usage);

    return {
      ...response,
      text,
      remaining: Number.isFinite(remaining) ? remaining : undefined,
    } satisfies GenerateResponse;
  },

  async TRACK_EVENT(message) {
    await trackEvent(message.payload as Parameters<typeof trackEvent>[0]);
    return { ok: true };
  },

  async OPEN_CHECKOUT(message) {
    const interval = (message.payload as { interval?: 'monthly' | 'yearly' })?.interval ?? 'monthly';
    await trackEvent({ event: 'upgrade_click', meta: { interval } });
    openCheckout(interval);
    return { ok: true };
  },

  async MOCK_PREMIUM(message) {
    const enable = (message.payload as { enable?: boolean })?.enable ?? true;
    const sub: SubscriptionState = {
      plan: enable ? 'premium' : 'free',
      status: enable ? 'active' : 'none',
      mockPremium: enable,
      currentPeriodEnd: enable
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    };
    await setInStorage(STORAGE_KEYS.subscription, sub);
    return sub;
  },

  async LOGIN(message) {
    const email = (message.payload as { email?: string })?.email ?? 'user@example.com';
    const user = await signIn(email);
    await trackEvent({ event: 'login' });
    return user;
  },

  async LOGOUT() {
    await signOut();
    return { ok: true };
  },

  async APPLY_REFERRAL(message) {
    const code = (message.payload as { code?: string })?.code ?? '';
    const applied = await applyReferralCode(code);
    if (applied) {
      await addBonusGenerations(REFERRAL_BONUS);
      await trackEvent({ event: 'referral_share', meta: { code } });
    }
    return { applied, bonus: REFERRAL_BONUS };
  },
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/options/index.html#welcome') });
  }
});
