// src/components/common/RatingStars.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { POP_SPRING } from '../../lib/motion';

interface RatingStarsProps {
  value: number; // 0 to 5
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: number;
  showScore?: boolean;
  count?: number;
}

export default function RatingStars({
  value,
  interactive = false,
  onChange,
  size = 16,
  showScore = false,
  count,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(activeValue);

          if (!interactive) {
            return (
              <Star
                key={star}
                style={{ width: size, height: size }}
                className={
                  isFilled
                    ? 'fill-[#F2A93B] text-[#F2A93B] drop-shadow-[0_1px_2px_rgba(242,169,59,0.4)]'
                    : 'fill-slate-200 text-slate-300 dark:fill-slate-800 dark:text-slate-700'
                }
              />
            );
          }

          return (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              transition={POP_SPRING}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="p-0.5 focus:outline-none"
            >
              <Star
                style={{ width: size, height: size }}
                className={`transition-colors duration-150 ${
                  isFilled
                    ? 'fill-[#F2A93B] text-[#F2A93B] drop-shadow-[0_2px_6px_rgba(242,169,59,0.5)]'
                    : 'fill-slate-200 text-slate-300 dark:fill-slate-800 dark:text-slate-700'
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      {showScore && (
        <span className="text-xs font-semibold tabular-nums text-ink">
          {value.toFixed(1)}
          {count !== undefined && (
            <span className="ml-1 text-[11px] font-normal text-ink-muted">
              ({count})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
