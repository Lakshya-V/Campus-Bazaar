// src/lib/motion.ts
//
// Centralized Apple & Antigravity motion tokens for physics, spring transitions,
// and micro-interactions. Imported everywhere to ensure cohesive animation polish.

import type { Transition, Variants } from 'framer-motion';

/** 3D Card tilt physics spring */
export const TILT_SPRING = {
  stiffness: 300,
  damping: 20,
  mass: 0.5,
};

/** Specular glare cursor tracking spring */
export const GLOSS_SPRING = {
  stiffness: 300,
  damping: 20,
};

/** Hover progress & bloom fade spring */
export const HOVER_SPRING = {
  stiffness: 250,
  damping: 22,
};

/** Shared layout spring for cards & elements (AnimatePresence & layoutId) */
export const LAYOUT_SPRING: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
};

/** Micro-interaction pop/bounce spring (wishlist heart, badge toggle, checkmarks) */
export const POP_SPRING: Transition = {
  type: 'spring',
  stiffness: 450,
  damping: 18,
};

/** Page-level smooth entrance / exit */
export const PAGE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

/** Fullscreen auth gate entrance / exit */
export const AUTH_GATE_VARIANTS: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
};

/** Modal dialog backdrop & scale */
export const MODAL_BACKDROP_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const MODAL_CONTENT_VARIANTS: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 10,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

/** Account drawer slide-in variants */
export const DRAWER_VARIANTS: Variants = {
  closed: { x: '100%', opacity: 0.8 },
  open: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 340, damping: 30 },
  },
};

/** Handshake connecting pulse for chat initialization */
export const HANDSHAKE_PULSE_VARIANTS: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
