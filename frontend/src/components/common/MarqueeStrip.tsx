// src/components/common/MarqueeStrip.tsx
import { motion } from 'framer-motion';

interface MarqueeStripProps {
  items: string[];
  speed?: number; // duration in seconds
  className?: string;
  tiltAngle?: number; // degrees of 3D tilt back
}

export default function MarqueeStrip({
  items,
  speed = 28,
  className = '',
  tiltAngle = 4,
}: MarqueeStripProps) {
  // Duplicate array 3 times to ensure a completely seamless continuous infinite loop
  const repeated = [...items, ...items, ...items];

  return (
    <div
      className={`w-full max-w-full overflow-hidden border-y border-borderline/60 bg-[#10131A] text-slate-300 select-none ${className}`}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className="w-full max-w-full overflow-hidden"
        style={{
          transform: `rotateX(${tiltAngle}deg)`,
          transformOrigin: 'top center',
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            ease: 'linear',
            duration: speed,
            repeat: Infinity,
          }}
          className="flex w-max items-center py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400"
        >
          {repeated.map((text, idx) => (
            <div key={`${text}-${idx}`} className="flex items-center gap-3 px-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2F6FED] opacity-80" />
              <span className="whitespace-nowrap">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
