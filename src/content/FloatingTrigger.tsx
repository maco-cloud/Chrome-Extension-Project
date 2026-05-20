import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props {
  rect: DOMRect;
  onClick: () => void;
}

export function FloatingTrigger({ rect, onClick }: Props) {
  const top = rect.top + window.scrollY + Math.min(rect.height - 36, 8);
  const left = rect.right + window.scrollX - 40;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="ara-trigger flex h-9 w-9 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/25 backdrop-blur-sm"
      style={{
        position: 'absolute',
        top,
        left: Math.max(8, left),
        zIndex: 2147483645,
      }}
      data-ara-ignore
      title="AI Reply Anywhere"
      aria-label="Open AI reply tools"
    >
      <Sparkles className="h-4 w-4" />
    </motion.button>
  );
}
