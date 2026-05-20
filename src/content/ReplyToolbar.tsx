import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, X, Lock, Star } from 'lucide-react';
import { useCallback, useState } from 'react';
import { TONES } from '../shared/constants';
import { sendMessage } from '../shared/messaging';
import type { EditableField } from './field-detector';
import { extractContext, getFieldText, setFieldText } from './field-detector';
import type { GenerateResponse, ToneId, ExtensionState } from '../shared/types';
import { isPremium, canUseTone } from '../shared/entitlements';

interface Props {
  field: EditableField;
  anchorRect: DOMRect;
  state: ExtensionState;
  onClose: () => void;
  onUpgrade: () => void;
}

export function ReplyToolbar({ field, anchorRect, state, onClose, onUpgrade }: Props) {
  const [loading, setLoading] = useState<ToneId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const premium = isPremium(state.subscription);
  const preferred = state.settings.preferredTone;

  const runTone = useCallback(
    async (tone: ToneId) => {
      if (!canUseTone(tone, state.subscription)) {
        onUpgrade();
        return;
      }

      setError(null);
      setLoading(tone);
      try {
        const data = await sendMessage<
          {
            tone: ToneId;
            context: string;
            draft?: string;
            siteHost: string;
          },
          GenerateResponse
        >({
          type: 'GENERATE_REPLY',
          payload: {
            tone,
            context: extractContext(field),
            draft: getFieldText(field),
            siteHost: location.hostname,
          },
        });

        setFieldText(field, data.text);
        field.focus();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Generation failed');
        sendMessage({
          type: 'TRACK_EVENT',
          payload: {
            event: 'error',
            error: e instanceof Error ? e.message : 'unknown',
            tone,
          },
        }).catch(() => {});
      } finally {
        setLoading(null);
      }
    },
    [field, onClose, onUpgrade, state.subscription],
  );

  const top = Math.min(anchorRect.top + window.scrollY - 52, window.innerHeight + window.scrollY - 120);
  const left = Math.min(
    anchorRect.left + window.scrollX,
    window.innerWidth + window.scrollX - 320,
  );

  const preferredTone = TONES.find((t) => t.id === preferred);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="ara-toolbar-root"
      style={{
        position: 'absolute',
        top,
        left: Math.max(8, left),
        zIndex: 2147483646,
      }}
      data-ara-ignore
    >
      <motion.div
        className="glass-panel flex max-w-[min(100vw-16px,360px)] flex-col gap-2 p-2 text-sm"
        layout
      >
        <motion.div
          className="flex items-center justify-between gap-2 border-b border-white/10 pb-2"
          layout
        >
          <span className="flex items-center gap-1.5 font-medium text-white/90">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            AI Reply
          </span>
          <button type="button" onClick={onClose} className="btn-ghost !p-1" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </motion.div>

        {preferredTone && (
          <button
            type="button"
            disabled={!!loading}
            onClick={() => runTone(preferred)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-500/25"
          >
            {loading === preferred ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Star className="h-3 w-3" />
            )}
            Quick: {preferredTone.emoji} {preferredTone.label}
          </button>
        )}

        <motion.div className="flex flex-wrap gap-1.5" layout>
          {TONES.map((tone) => {
            const locked = tone.premium && !premium;
            const isLoading = loading === tone.id;
            return (
              <motion.button
                key={tone.id}
                type="button"
                disabled={!!loading}
                onClick={() => runTone(tone.id)}
                whileTap={{ scale: 0.97 }}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition ${
                  locked
                    ? 'border-white/5 bg-white/5 text-zinc-500'
                    : 'border-white/10 bg-white/5 text-zinc-200 hover:border-indigo-500/40 hover:bg-indigo-500/10'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <span>{tone.emoji}</span>
                )}
                {tone.label}
              </motion.button>
            );
          })}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {!premium && (
          <button type="button" onClick={onUpgrade} className="btn-primary w-full !py-1.5 text-xs">
            Upgrade for all tones & unlimited
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
