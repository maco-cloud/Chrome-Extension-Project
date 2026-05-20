export type ToneId =
  | 'professional'
  | 'friendly'
  | 'concise'
  | 'confident'
  | 'funny'
  | 'flirty'
  | 'rewrite'
  | 'grammar';

export type PlanId = 'free' | 'premium';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  referralCode: string;
  referredBy?: string;
}

export interface UsageState {
  dateKey: string;
  generationsToday: number;
  bonusGenerations: number;
  totalGenerations: number;
}

export interface SubscriptionState {
  plan: PlanId;
  status: 'active' | 'trialing' | 'canceled' | 'none';
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  mockPremium?: boolean;
}

export interface AppSettings {
  preferredTone: ToneId;
  darkMode: boolean;
  showSignature: boolean;
  enabledSites: Record<string, boolean>;
  customPrompts: Partial<Record<ToneId, string>>;
  generationMaxTokens: number;
}

export interface GenerateRequest {
  tone: ToneId;
  context: string;
  draft?: string;
  siteHost: string;
  includeSignature?: boolean;
  customPrompt?: string;
  maxTokens?: number;
}

export interface GenerateResponse {
  text: string;
  tone: ToneId;
  cached?: boolean;
  remaining?: number;
}

export type AnalyticsEvent =
  | 'generation'
  | 'upgrade_click'
  | 'login'
  | 'error'
  | 'referral_share'
  | 'toolbar_open';

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  tone?: ToneId;
  siteHost?: string;
  error?: string;
  meta?: Record<string, string | number | boolean>;
}

export type MessageType =
  | 'GENERATE_REPLY'
  | 'GET_STATE'
  | 'GET_ANALYTICS'
  | 'TRACK_EVENT'
  | 'OPEN_CHECKOUT'
  | 'MOCK_PREMIUM'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPLY_REFERRAL';

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface ExtensionState {
  user: UserProfile | null;
  usage: UsageState;
  subscription: SubscriptionState;
  settings: AppSettings;
}
