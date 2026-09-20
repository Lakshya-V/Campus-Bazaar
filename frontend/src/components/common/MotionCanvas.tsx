import { useEffect, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

interface OrbConfig {
  id: string
  size: number
  top: string
  left: string
  color: 'brand' | 'accent'
  /** How strongly this orb reacts to the cursor, relative to others. */
  depth: number
  /** How strongly this orb parallaxes against scroll. */
  scrollWeight: number
}

const ORBS: OrbConfig[] = [
  { id: 'orb-1', size: 520, top: '-8%', left: '8%', color: 'brand', depth: 26, scrollWeight: 60 },
  { id: 'orb-2', size: 380, top: '38%', left: '72%', color: 'accent', depth: 40, scrollWeight: -90 },
  { id: 'orb-3', size: 460, top: '68%', left: '18%', color: 'brand', depth: 18, scrollWeight: 40 },
  { id: 'orb-4', size: 300, top: '10%', left: '58%', color: 'accent', depth: 34, scrollWeight: -50 },
]

const ORB_SPRING = { stiffness: 60, damping: 20, mass: 0.8 }

function Orb({ config, mouseX, mouseY, scrollYProgress }: {
  config: OrbConfig
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const parallaxX = useTransform(mouseX, [-1, 1], [-config.depth, config.depth])
  const parallaxY = useTransform(mouseY, [-1, 1], [-config.depth, config.depth])
  const scrollY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, config.scrollWeight]
  )

  const springX = useSpring(parallaxX, ORB_SPRING)
  const springY = useSpring(parallaxY, ORB_SPRING)
  const springScrollY = useSpring(scrollY, ORB_SPRING)

  const y = useTransform([springY, springScrollY], ([a, b]) => (a as number) + (b as number))

  const gradient =
    config.color === 'brand'
      ? 'radial-gradient(circle, rgba(161, 161, 170, 0.15) 0%, rgba(228, 228, 231, 0.08) 45%, transparent 72%)'
      : 'radial-gradient(circle, rgba(113, 113, 122, 0.13) 0%, rgba(212, 212, 216, 0.07) 45%, transparent 72%)'

  return (
    <motion.div
      aria-hidden
      className="absolute rounded-full will-change-transform"
      animate={{
        scale: [1, 1.06, 0.97, 1],
        opacity: [0.65, 0.85, 0.7, 0.65],
      }}
      transition={{
        duration: config.depth * 0.8 + 12,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        top: config.top,
        left: config.left,
        width: config.size,
        height: config.size,
        background: gradient,
        x: springX,
        y,
        filter: 'blur(80px)',
      }}
    />
  )
}

/**
 * Spatial ambient canvas: an Apple-style ambient field of volumetric
 * monochromatic orbs sitting quietly behind page content. Orbs exhibit organic
 * color and scale shifts, spring-driven mouse coordinate parallax, and
 * scroll reactivity.
 */
export function MotionCanvas({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const { scrollYProgress } = useScroll()

  useEffect(() => {
    if (prefersReducedMotion) return

    function handlePointerMove(event: globalThis.MouseEvent) {
      const width = window.innerWidth
      const height = window.innerHeight
      mouseX.set((event.clientX / width) * 2 - 1)
      mouseY.set((event.clientY / height) * 2 - 1)
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('mousemove', handlePointerMove)
  }, [mouseX, mouseY, prefersReducedMotion])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface-base transition-colors duration-500 ${className}`}
    >
      {ORBS.map((orb) => (
        <Orb
          key={orb.id}
          config={orb}
          mouseX={mouseX}
          mouseY={mouseY}
          scrollYProgress={scrollYProgress}
        />
      ))}

      {/* Soft vignette overlay so volumetric orbs never conflict with text */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base/0 via-surface-base/15 to-surface-base/70 pointer-events-none" />
    </div>
  )
}

export default MotionCanvas