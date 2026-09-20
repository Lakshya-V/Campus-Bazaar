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
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          panel: 'rgb(var(--surface-panel) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          primary: 'rgb(var(--ink-primary) / <alpha-value>)',
          secondary: 'rgb(var(--ink-secondary) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          tertiary: 'rgb(var(--ink-tertiary) / <alpha-value>)',
        },
        brand: {
          DEFAULT: '#2F6FED',
          tint: '#EAF1FF',
          deep: '#1B4FC4',
          glow: '#4F8CFF',
          soft: '#4F8CFF',
        },
        accent: {
          DEFAULT: '#2F6FED',
          soft: '#4F8CFF',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
        borderline: 'rgb(var(--borderline) / <alpha-value>)',
        status: {
          success: '#1AA260',
          danger: '#E24C4B',
          star: '#F2A93B',
          muted: '#6B7280',
        },
        condition: {
          new: '#1AA260',
          good: '#2F6FED',
          fair: '#E0912B',
        },
        // 5-Color System Exact Hex Tokens
        'ink-navy': '#10131A',
        amber: {
          DEFAULT: '#F2994A',
          deep: '#D97B2B',
        },
        'amber-deep': '#D97B2B',
        blue: {
          DEFAULT: '#2F6FED',
          deep: '#1B4FC4',
        },
        'success-green': '#1AA260',
        'alert-red': '#E24C4B',
        'rating-gold': '#F2A93B',
        buy: '#2F6FED',
        sell: '#2F6FED',
      },
      boxShadow: {
        '3d-sm': 'var(--shadow-3d-sm)',
        '3d-md': 'var(--shadow-3d-md)',
        '3d-lg': 'var(--shadow-3d-lg)',
        specular: 'var(--shadow-specular)',
        'specular-lg': 'var(--shadow-specular-lg)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring-snap': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        display: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        text: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
      matchUtilities(
        { perspective: (value) => ({ perspective: value }) },
        {
          values: {
            500: '500px',
            800: '800px',
            1000: '1000px',
            1200: '1200px',
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
