// src/components/common/ThemeToggle.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 };

/**
 * Minimalist Apple / VisionOS-style frosted glass theme toggle.
 * Smoothly morphs, scales, and rotates between Sun and Moon icons with tactile spring physics.
 */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        group relative flex h-10 w-10 items-center justify-center
        rounded-full border border-black/10 dark:border-white/15
        bg-white/70 dark:bg-white/10
        backdrop-blur-xl
        shadow-3d-sm
        transition-all duration-300
        hover:border-purple-500/50 hover:shadow-specular
        focus-ring
      "
    >
      {/* Specular glass reflection overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent dark:from-white/20 dark:to-transparent opacity-80"
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={SPRING}
          className={`relative z-10 flex items-center justify-center ${
            isDark
              ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.75)]'
              : 'text-purple-600 drop-shadow-[0_0_6px_rgba(124,58,237,0.35)]'
          }`}
        >
          {isDark ? (
            <Moon size={19} strokeWidth={2.25} />
          ) : (
            <Sun size={19} strokeWidth={2.25} />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export default ThemeToggle;