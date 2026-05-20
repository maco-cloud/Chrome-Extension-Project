import { motion } from 'framer-motion';
import {
  Crown,
  LogIn,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Zap,
  Gift,
  Copy,
  Check,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useExtensionState } from '../shared/hooks/useExtensionState';
import { sendMessage } from '../shared/messaging';
import { isPremium, remainingGenerations } from '../shared/entitlements';
import { FREE_DAILY_LIMIT, EXTENSION_NAME } from '../shared/constants';
import { getPricingCopy } from '../shared/billing/stripe';

export function PopupApp() {
  const { state, loading, refresh } = useExtensionState();
  const [email, setEmail] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ total: number; topTone: string } | null>(null);
  const pricing = getPricingCopy();

  useEffect(() => {
    sendMessage({ type: 'GET_ANALYTICS' })
      .then((data) => {
        const store = data as {
          events: { event: string }[];
          toneCounts: Record<string, number>;
        };
        const total = store.events.filter((e) => e.event === 'generation').length;
        const top = Object.entries(store.toneCounts).sort((a, b) => b[1] - a[1])[0];
        setStats({ total, topTone: top?.[0] ?? '—' });
      })
      .catch(() => {});
  }, []);

  if (loading || !state) {
    return (
      <motion.div className="flex min-h-[480px] items-center justify-center p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Sparkles className="h-8 w-8 text-accent" />
        </motion.div>
      </motion.div>
    );
  }

  const premium = isPremium(state.subscription);
  const remaining = remainingGenerations(state.subscription, state.usage);
  const remainingLabel = Number.isFinite(remaining)
    ? `${remaining} left today`
    : 'Unlimited';

  const toggleDark = async () => {
    const next = !state.settings.darkMode;
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    await chrome.storage.local.set({
      ara_settings: { ...state.settings, darkMode: next },
    });
    refresh();
  };

  const handleLogin = async () => {
    await sendMessage({ type: 'LOGIN', payload: { email: email || 'you@email.com' } });
    refresh();
  };

  const handleLogout = async () => {
    await sendMessage({ type: 'LOGOUT' });
    refresh();
  };

  const handleUpgrade = () => {
    sendMessage({ type: 'OPEN_CHECKOUT', payload: { interval: 'monthly' } });
  };

  const handleMockPremium = async () => {
    await sendMessage({ type: 'MOCK_PREMIUM', payload: { enable: !premium } });
    refresh();
  };

  const copyReferral = async () => {
    const code = state.user?.referralCode ?? 'ARA-DEMO';
    await navigator.clipboard.writeText(
      `Try ${EXTENSION_NAME}! Use my code ${code} for bonus generations.`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    sendMessage({ type: 'TRACK_EVENT', payload: { event: 'referral_share' } });
  };

  const applyReferral = async () => {
    await sendMessage({ type: 'APPLY_REFERRAL', payload: { code: referralInput } });
    setReferralInput('');
    refresh();
  };

  return (
    <div className="flex min-h-[480px] flex-col bg-gradient-to-b from-surface to-[rgb(10,10,14)] p-4">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            {EXTENSION_NAME}
          </h1>
          <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
            Reply smarter on any site
          </p>
        </div>
        <button type="button" onClick={toggleDark} className="btn-ghost" aria-label="Toggle theme">
          {state.settings.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {stats && (
        <div className="glass-panel mb-3 grid grid-cols-2 gap-2 p-3 text-center text-xs">
          <motion.div layout>
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-[rgb(var(--text-muted))]">Generations</p>
          </motion.div>
          <motion.div layout>
            <p className="text-lg font-bold capitalize">{stats.topTone}</p>
            <p className="text-[rgb(var(--text-muted))]">Top tone</p>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel mb-3 p-4"
      >
        <motion.div className="flex items-center justify-between">
          <span className="text-sm text-[rgb(var(--text-muted))]">Plan</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              premium ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-zinc-300'
            }`}
          >
            {premium && <Crown className="h-3 w-3" />}
            {premium ? 'Premium' : 'Free'}
          </span>
        </motion.div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{remainingLabel}</p>
            <p className="text-xs text-[rgb(var(--text-muted))]">
              {premium
                ? 'All tones · Priority'
                : `${FREE_DAILY_LIMIT}/day free · Basic tones`}
            </p>
          </div>
          <Zap className="h-8 w-8 text-indigo-400/60" />
        </div>
        {!premium && (
          <button type="button" onClick={handleUpgrade} className="btn-primary mt-3 w-full">
            Upgrade — {pricing.monthly}
          </button>
        )}
      </motion.div>

      {state.user ? (
        <div className="glass-panel mb-3 flex items-center justify-between p-3 text-sm">
          <span className="truncate">{state.user.email}</span>
          <button type="button" onClick={handleLogout} className="btn-ghost">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="glass-panel mb-3 space-y-2 p-3">
          <input
            type="email"
            placeholder="Email (demo login)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
          />
          <button type="button" onClick={handleLogin} className="btn-primary w-full">
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
        </div>
      )}

      <div className="glass-panel mb-3 space-y-2 p-3">
        <p className="text-xs font-medium text-[rgb(var(--text-muted))]">Invite friends</p>
        <p className="text-xs">
          Share your code:{' '}
          <code className="rounded bg-white/10 px-1">
            {state.user?.referralCode ?? 'Sign in for code'}
          </code>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyReferral}
            className="btn-ghost flex-1 border border-white/10"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy invite
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={referralInput}
            onChange={(e) => setReferralInput(e.target.value)}
            placeholder="Friend's ARA- code"
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs"
          />
          <button type="button" onClick={applyReferral} className="btn-ghost border border-white/10">
            <Gift className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={() => chrome.runtime.openOptionsPage()}
          className="btn-ghost w-full justify-start border border-white/10"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          type="button"
          onClick={handleMockPremium}
          className="btn-ghost w-full justify-start text-xs opacity-60"
        >
          Dev: {premium ? 'Disable' : 'Enable'} mock Premium
        </button>
      </div>
    </div>
  );
}
