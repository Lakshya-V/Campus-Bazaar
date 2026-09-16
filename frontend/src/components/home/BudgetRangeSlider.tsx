// src/components/home/BudgetRangeSlider.tsx
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

interface BudgetRangeSliderProps {
  maxPrice?: number;
  value: number; // current max budget filter (0 - 500, 500 = All)
  onChange: (value: number) => void;
}

const MAX_LIMIT = 500;
const STEP = 10;

export default function BudgetRangeSlider({
  value,
  onChange,
}: BudgetRangeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const activeValue = isDragging && dragValue !== null ? dragValue : value;

  const updateValueFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const percentage = clickX / rect.width;
      const raw = Math.round((percentage * MAX_LIMIT) / STEP) * STEP;
      const clamped = Math.max(0, Math.min(MAX_LIMIT, raw));

      setDragValue(clamped);
      onChange(clamped);
    },
    [onChange]
  );

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateValueFromPointer(e.clientX);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    updateValueFromPointer(e.clientX);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (isDragging) {
      setIsDragging(false);
      setDragValue(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture release safety
      }
    }
  }

  const percentage = Math.min(100, Math.max(0, (activeValue / MAX_LIMIT) * 100));

  const displayLabel =
    activeValue >= MAX_LIMIT
      ? 'All Prices'
      : activeValue <= 0
      ? 'Free items only'
      : `Up to $${activeValue}`;

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        <SlidersHorizontal className="h-3.5 w-3.5 text-[#2F6FED]" />
        <span>Budget:</span>
      </div>

      {/* Track & Draggable Thumb Container */}
      <div className="relative flex items-center w-36 sm:w-48 select-none py-2">
        {/* Clickable/Draggable Hit Area */}
        <div
          ref={trackRef}
          data-testid="budget-slider-track"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative h-2 w-full rounded-full bg-surface-elevated border border-borderline cursor-pointer touch-none"
        >
          {/* Active Fill Track */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2F6FED] to-[#598eff]"
            style={{ width: `${percentage}%` }}
          />

          {/* Draggable Handle / Thumb */}
          <motion.div
            data-testid="budget-slider-handle"
            animate={{
              scale: isDragging ? 1.2 : 1,
              boxShadow: isDragging
                ? '0 0 16px rgba(47, 111, 237, 0.6), 0 4px 10px rgba(0, 0, 0, 0.25)'
                : '0 1px 3px rgba(0, 0, 0, 0.15)',
            }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white bg-[#2F6FED] dark:border-[#10131A] cursor-grab active:cursor-grabbing z-20 flex items-center justify-center"
            style={{ left: `${percentage}%` }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white" />

            {/* Floating Live Value Tooltip While Dragging */}
            {isDragging && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#10131A] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg border border-white/10"
              >
                ${activeValue}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Live Selected Range / Value Text */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`font-semibold rounded-full px-2.5 py-0.5 text-[11px] border transition-colors ${
            isDragging
              ? 'bg-[#2F6FED] text-white border-[#2F6FED] shadow-xs'
              : activeValue < MAX_LIMIT
              ? 'bg-surface-elevated text-ink border-borderline font-bold'
              : 'bg-surface-base text-ink-muted border-borderline'
          }`}
        >
          {displayLabel}
        </span>

        {activeValue < MAX_LIMIT && (
          <button
            type="button"
            onClick={() => {
              onChange(MAX_LIMIT);
            }}
            className="text-[10px] text-ink-muted underline hover:text-ink cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
