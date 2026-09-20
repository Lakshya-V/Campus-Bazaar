// src/components/common/Apple3DCard.tsx
import { useRef, type ReactNode, type MouseEvent } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';
import { TILT_SPRING, GLOSS_SPRING, HOVER_SPRING } from '../../lib/motion';

const MAX_TILT_DEG = 14;

interface Apple3DCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees on either axis. Defaults to 14. */
  maxTilt?: number;
  /** Disables tilt + gloss while keeping static elevation (e.g. reduced motion). */
  disableTilt?: boolean;
  onClick?: () => void;
}

/**
 * Apple & Antigravity-grade 3D tilt card with 1200px perspective, multi-layer
 * depth parallax, cursor-following specular glare, and theme-adaptive elevation bloom.
 */
export function Apple3DCard({
  children,
  className = '',
  maxTilt = MAX_TILT_DEG,
  disableTilt = false,
  onClick,
}: Apple3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Raw pointer position normalized around 0 (-0.5 to 0.5)
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  // Glare position in percentages (0 to 100)
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  // Hover state for glare opacity and elevation bloom
  const hoverProgress = useMotionValue(0);

  const springX = useSpring(pointerX, TILT_SPRING);
  const springY = useSpring(pointerY, TILT_SPRING);
  const glareSpringX = useSpring(glareX, GLOSS_SPRING);
  const glareSpringY = useSpring(glareY, GLOSS_SPRING);
  const hoverSpring = useSpring(hoverProgress, HOVER_SPRING);

  // Increased sensitivity: reaches max tilt (~14deg) nearer edges (at +/- 0.38)
  const rotateX = useTransform(springY, [-0.38, 0.38], [maxTilt, -maxTilt], { clamp: true });
  const rotateY = useTransform(springX, [-0.38, 0.38], [-maxTilt, maxTilt], { clamp: true });

  // Specular glare: soft radial glow (0.15 - 0.22 opacity) centered on pointer relative to card
  const glareBackground = useMotionTemplate`radial-gradient(circle 320px at ${glareSpringX}% ${glareSpringY}%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.05) 45%, transparent 80%)`;
  const accentAura = useMotionTemplate`radial-gradient(circle 360px at ${glareSpringX}% ${glareSpringY}%, rgba(161, 161, 170, 0.12), transparent 70%)`;

  // Glare opacity fades in on hover, fades out cleanly through spring on leave
  const glareOpacity = useTransform(hoverSpring, [0, 1], [0, 1]);

  // Ambient box-shadow / glow bloom on hover pulling from theme's brand/accent token
  // Light: #2F6FED @ 18%, Dark: #4F8CFF @ 35%
  const elevationShadow = useTransform(
    hoverSpring,
    [0, 1],
    [
      '0 4px 10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 45px -8px rgba(161, 161, 170, 0.18)'
    ]
  );

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    if (disableTilt || !cardRef.current) return;
    const bounds = cardRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const relativeY = (event.clientY - bounds.top) / bounds.height;

    pointerX.set(relativeX - 0.5);
    pointerY.set(relativeY - 0.5);
    glareX.set(relativeX * 100);
    glareY.set(relativeY * 100);
    hoverProgress.set(1);
  }

  function handlePointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
    glareX.set(50);
    glareY.set(50);
    hoverProgress.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative ${className}`}
      style={{ perspective: 1200 }}
    >
      <motion.div
        className="specular-border apple-glass preserve-3d relative rounded-3xl"
        style={{
          rotateX: disableTilt ? 0 : rotateX,
          rotateY: disableTilt ? 0 : rotateY,
          boxShadow: elevationShadow,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Parallax layers container */}
        <div
          className="relative z-10 preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>

        {/* Specular glare overlay */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
          style={{
            background: glareBackground,
            opacity: glareOpacity,
          }}
        />

        {/* Ambient brand aura beneath glare */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-3xl mix-blend-screen"
          style={{
            background: accentAura,
            opacity: glareOpacity,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default Apple3DCard;