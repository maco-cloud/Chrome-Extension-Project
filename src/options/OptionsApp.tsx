import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, TONES, STORAGE_KEYS, FREE_DAILY_LIMIT } from '../shared/constants';
import { useExtensionState } from '../shared/hooks/useExtensionState';
import { sendMessage } from '../shared/messaging';
import { getPricingCopy } from '../shared/billing/stripe';
import { isPremium } from '../shared/entitlements';
import type { AppSettings, ToneId } from '../shared/types';

const SITE_OPTIONS = [
  { key: 'mail.google.com', label: 'Gmail' },
  { key: 'www.linkedin.com', label: 'LinkedIn' },
  { key: 'app.slack.com', label: 'Slack' },
  { key: 'x.com', label: 'X / Twitter' },
  { key: 'www.reddit.com', label: 'Reddit' },
  { key: 'tinder.com', label: 'Tinder' },
  { key: 'bumble.com', label: 'Bumble' },
  { key: 'hinge.co', label: 'Hinge' },
  { key: '*', label: 'All other sites' },
];

export function OptionsApp() {
  const { state, loading, refresh } = useExtensionState();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const pricing = getPricingCopy();

  useEffect(() => {
    if (state) setSettings(state.settings);
    document.documentElement.classList.toggle('dark', state?.settings.darkMode ?? true);
  }, [state]);

  useEffect(() => {
    if (location.hash.replace('#', '') === 'welcome') {
      setShowWelcome(true);
    }
  }, []);

  const save = async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  };

  const updateSite = (key: string, enabled: boolean) => {
    setSettings((s) => ({
      ...s,
      enabledSites: { ...s.enabledSites, [key]: enabled },
    }));
  };

  const updatePrompt = (tone: ToneId, value: string) => {
    setSettings((s) => ({
      ...s,
      customPrompts: { ...s.customPrompts, [tone]: value },
    }));
  };

  if (loading || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Sparkles className="h-10 w-10 animate-pulse text-indigo-400" />
      </div>
    );
  }

  const premium = isPremium(state.subscription);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-[rgb(8,8,12)] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="text-indigo-400" />
            Settings
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Customize tones, sites, and generation — no API keys needed.
          </p>
        </header>

        {showWelcome && (
          <motion.section
            id="welcome"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel space-y-4 border border-indigo-500/30 p-5"
          >
            <h2 className="text-lg font-semibold">Welcome to AI Reply Anywhere</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-[rgb(var(--text-muted))]">
              <li>Visit Gmail, LinkedIn, Slack, or any site with a text field.</li>
              <li>Click into a message box — a sparkles button appears.</li>
              <li>Pick a tone (Professional, Friendly, Concise, and more).</li>
              <li>Your reply is generated instantly — no API keys required.</li>
            </ol>
            <p className="text-xs text-[rgb(var(--text-muted))]">
              Free: {FREE_DAILY_LIMIT} generations/day · Premium: unlimited + all tones.
            </p>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                setShowWelcome(false);
                history.replaceState(null, '', location.pathname);
              }}
            >
              Got it — start replying
            </button>
          </motion.section>
        )}

        <section id="billing" className="glass-panel space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Crown className="h-5 w-5 text-amber-400" />
            Premium
          </h2>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            {premium
              ? 'You have Premium active.'
              : `Free: limited daily generations. Premium: unlimited + all tones.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                sendMessage({ type: 'OPEN_CHECKOUT', payload: { interval: 'monthly' } })
              }
            >
              Monthly {pricing.monthly}
            </button>
            <button
              type="button"
              className="btn-ghost border border-white/10"
              onClick={() =>
                sendMessage({ type: 'OPEN_CHECKOUT', payload: { interval: 'yearly' } })
              }
            >
              Yearly {pricing.yearly}
            </button>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => sendMessage({ type: 'MOCK_PREMIUM', payload: { enable: true } })}
            >
              Enable mock Premium (dev)
            </button>
          </div>
        </section>

        <section className="glass-panel space-y-4 p-5">
          <h2 className="font-semibold">Preferred tone</h2>
          <select
            value={settings.preferredTone}
            onChange={(e) =>
              setSettings((s) => ({ ...s, preferredTone: e.target.value as ToneId }))
            }
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          >
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showSignature}
              onChange={(e) => setSettings((s) => ({ ...s, showSignature: e.target.checked }))}
            />
            Add viral signature to free-tier replies
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => setSettings((s) => ({ ...s, darkMode: e.target.checked }))}
            />
            Dark mode
          </label>

          <div>
            <label className="text-sm text-[rgb(var(--text-muted))]">
              Max tokens (backend hint)
            </label>
            <input
              type="range"
              min={128}
              max={1024}
              step={64}
              value={settings.generationMaxTokens}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  generationMaxTokens: Number(e.target.value),
                }))
              }
              className="mt-1 w-full"
            />
            <span className="text-xs">{settings.generationMaxTokens}</span>
          </div>
        </section>

        <section className="glass-panel space-y-3 p-5">
          <h2 className="font-semibold">Supported sites</h2>
          {SITE_OPTIONS.map((site) => (
            <label key={site.key} className="flex items-center justify-between text-sm">
              <span>{site.label}</span>
              <input
                type="checkbox"
                checked={settings.enabledSites[site.key] ?? false}
                onChange={(e) => updateSite(site.key, e.target.checked)}
              />
            </label>
          ))}
        </section>

        <section className="glass-panel space-y-3 p-5">
          <h2 className="font-semibold">Custom prompts (Premium)</h2>
          <p className="text-xs text-[rgb(var(--text-muted))]">
            Optional style hints sent to our API per tone.
          </p>
          {TONES.slice(0, 4).map((t) => (
            <div key={t.id}>
              <label className="text-xs text-[rgb(var(--text-muted))]">{t.label}</label>
              <textarea
                rows={2}
                disabled={!premium}
                placeholder={premium ? 'Custom instructions…' : 'Premium required'}
                value={settings.customPrompts[t.id] ?? ''}
                onChange={(e) => updatePrompt(t.id, e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-sm disabled:opacity-50"
              />
            </div>
          ))}
        </section>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={save}
          className="btn-primary w-full"
        >
          {saved ? 'Saved ✓' : 'Save settings'}
        </motion.button>

        <p className="pb-8 text-center text-xs text-[rgb(var(--text-muted))]">
          Privacy: text is sent only to our API for generation. We never ask for OpenAI keys.
        </p>
      </div>
    </div>
  );
}
