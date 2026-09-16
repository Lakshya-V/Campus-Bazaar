// src/context/CartSwipeContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';

interface TriggerOptions {
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

interface CartSwipeContextType {
  triggerCartSwipe: (targetUrl?: string, options?: TriggerOptions) => void;
  triggerCartLoading: (targetUrl?: string, options?: TriggerOptions) => void;
  isSwiping: boolean;
  isLoading: boolean;
  loadingMessage: string;
}

const CartSwipeContext = createContext<CartSwipeContextType | undefined>(undefined);

export function CartSwipeProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading item details...');
  const navigate = useNavigate();

  const triggerCartSwipe = useCallback(
    (targetUrl?: string, options?: TriggerOptions) => {
      if (isLoading) return;

      const duration = options?.duration ?? 750; // 750ms per e-commerce loading spec (600-900ms)
      const msg = options?.message ?? 'Loading item details...';

      setLoadingMessage(msg);
      setIsLoading(true);

      // Programmatic navigation triggered at 550ms so view renders cleanly before loader fades out
      if (targetUrl) {
        setTimeout(() => {
          navigate(targetUrl);
        }, Math.max(duration - 200, 350));
      }

      // Finish loading animation after duration
      setTimeout(() => {
        setIsLoading(false);
        if (options?.onComplete) {
          options.onComplete();
        }
      }, duration);
    },
    [isLoading, navigate]
  );

  return (
    <CartSwipeContext.Provider
      value={{
        triggerCartSwipe,
        triggerCartLoading: triggerCartSwipe,
        isSwiping: isLoading,
        isLoading,
        loadingMessage,
      }}
    >
      {children}

      {/* Localized Cart Loading Indicator Dialog */}
      <AnimatePresence>
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none select-none">
            {/* Subtle frosted glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
            />

            {/* Localized Centered Loading Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex w-72 flex-col items-center justify-center rounded-3xl border border-borderline bg-surface/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              {/* Localized Runway Track (~150px travel distance) */}
              <div className="relative mb-3 flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-base/80 px-4 border border-borderline/60">
                {/* Runway subtle guideline */}
                <div className="absolute inset-x-4 h-0.5 rounded-full bg-borderline" />

                {/* Animated Glowing Cart on localized runway */}
                <motion.div
                  initial={{ x: -75 }}
                  animate={{ x: 75 }}
                  transition={{
                    duration: 0.75,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className="relative z-10 flex items-center gap-2"
                >
                  {/* Trailing speed dots in palette colors */}
                  <div className="flex items-center gap-1 opacity-70">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F2994A]" />
                    <span className="h-2 w-3 rounded-full bg-[#2F6FED]" />
                  </div>

                  {/* Cart Icon */}
                  <motion.div
                    animate={{ y: [0, -3, 0], rotate: [-1, 2, 0] }}
                    transition={{ duration: 0.38, repeat: 1, ease: 'easeInOut' }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-borderline bg-surface shadow-md"
                  >
                    <Logo size={26} />
                  </motion.div>
                </motion.div>
              </div>

              {/* Perceivable Loading Status Label */}
              <div className="flex items-center gap-2 text-center">
                <span className="h-2 w-2 animate-ping rounded-full bg-[#2F6FED]" />
                <span className="font-display text-xs font-semibold text-ink tracking-tight">
                  {loadingMessage}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CartSwipeContext.Provider>
  );
}

export function useCartSwipe() {
  const context = useContext(CartSwipeContext);
  if (!context) {
    throw new Error('useCartSwipe must be used within a CartSwipeProvider');
  }
  return context;
}
