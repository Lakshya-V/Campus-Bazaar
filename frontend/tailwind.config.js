/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic surface stack — values come from CSS vars in index.css,
        // so the same class names repaint automatically between modes.
        surface: {
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          panel: 'rgb(var(--surface-panel) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          secondary: 'rgb(var(--ink-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--ink-tertiary) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
          deep: 'rgb(var(--brand-deep) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        borderline: 'rgb(var(--borderline) / <alpha-value>)',
      },
      boxShadow: {
        // 3D hardware elevation — each token already bakes in the
        // top-edge specular highlight for the active mode.
        '3d-sm': 'var(--shadow-3d-sm)',
        '3d-md': 'var(--shadow-3d-md)',
        '3d-lg': 'var(--shadow-3d-lg)',
        specular: 'var(--shadow-specular)',
        'specular-lg': 'var(--shadow-specular-lg)',
      },
      transitionTimingFunction: {
        // Framer-Motion-flavored spring curves for CSS-only transitions
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring-snap': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        display: ['"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
        text: ['"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'orb-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -18px, 0) scale(1.04)' },
        },
      },
      animation: {
        'orb-float': 'orb-float 12s cubic-bezier(0.45, 0, 0.55, 1) infinite',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, matchUtilities, theme }) {
      // perspective-* utilities for 3D tilt cards
      matchUtilities(
        { perspective: (value) => ({ perspective: value }) },
        {
          values: {
            500: '500px',
            800: '800px',
            1000: '1000px',
            1500: '1500px',
            2000: '2000px',
            ...(theme('perspectiveValues') || {}),
          },
        }
      )

      addUtilities({
        '.preserve-3d': { transformStyle: 'preserve-3d' },
        '.flat-3d': { transformStyle: 'flat' },
        '.backface-hidden': { backfaceVisibility: 'hidden' },
      })
    }),
  ],
}
