import type { ToneId } from './types';

export const EXTENSION_NAME = 'AI Reply Anywhere';
export const SIGNATURE = '\n\n— Generated with AI Reply Anywhere';
export const FREE_DAILY_LIMIT = 15;
export const REFERRAL_BONUS = 10;

export const TONES: {
  id: ToneId;
  label: string;
  emoji: string;
  premium: boolean;
}[] = [
  { id: 'professional', label: 'Professional', emoji: '💼', premium: false },
  { id: 'friendly', label: 'Friendly', emoji: '😊', premium: false },
  { id: 'concise', label: 'Concise', emoji: '⚡', premium: false },
  { id: 'confident', label: 'Confident', emoji: '🎯', premium: true },
  { id: 'funny', label: 'Funny', emoji: '😄', premium: true },
  { id: 'flirty', label: 'Flirty', emoji: '💫', premium: true },
  { id: 'rewrite', label: 'Rewrite', emoji: '✍️', premium: true },
  { id: 'grammar', label: 'Grammar', emoji: '📝', premium: true },
];

export const FREE_TONES = new Set<ToneId>(
  TONES.filter((t) => !t.premium).map((t) => t.id),
);

export const DEFAULT_SETTINGS = {
  preferredTone: 'professional' as ToneId,
  darkMode: true,
  showSignature: true,
  enabledSites: {
    'mail.google.com': true,
    'www.linkedin.com': true,
    'app.slack.com': true,
    'x.com': true,
    'twitter.com': true,
    'www.reddit.com': true,
    'tinder.com': true,
    'bumble.com': true,
    'hinge.co': true,
    '*': true,
  },
  customPrompts: {},
  generationMaxTokens: 512,
};

export const STORAGE_KEYS = {
  user: 'ara_user',
  usage: 'ara_usage',
  subscription: 'ara_subscription',
  settings: 'ara_settings',
  analytics: 'ara_analytics',
} as const;

export const BILLING = {
  monthlyPrice: '$9.99/mo',
  yearlyPrice: '$79.99/yr',
  trialDays: 7,
} as const;
