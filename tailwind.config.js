/**
 * Tailwind config — semantic CSS-variable-backed color tokens.
 * To retheme: update the CSS custom properties in src/index.css only.
 * All colors support Tailwind's opacity modifier (e.g. bg-accent/50)
 * via the RGB-channel variable pattern.
 */

/** Returns a Tailwind color function backed by a CSS custom property. */
const withOpacity = (variable) => ({ opacityValue }) =>
  opacityValue !== undefined
    ? `rgba(var(${variable}), ${opacityValue})`
    : `rgb(var(${variable}))`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background:       withOpacity('--background'),
        surface:          withOpacity('--surface'),
        'surface-raised': withOpacity('--surface-raised'),
        primary:          withOpacity('--text-primary'),
        secondary:        withOpacity('--text-secondary'),
        muted:            withOpacity('--text-muted'),
        stroke:           withOpacity('--stroke'),
        accent: {
          DEFAULT: withOpacity('--accent'),
          light:   withOpacity('--accent-light'),
          dark:    withOpacity('--accent-dark'),
        },
        danger:  withOpacity('--danger'),
        ok:      withOpacity('--ok'),
        caution: withOpacity('--caution'),
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Inter', 'sans-serif'],
      },

      screens: { xs: '480px' },

      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        slideInLeft:  { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        slideUp:      { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:      { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
      },

      animation: {
        'fade-in':        'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-left':  'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':       'slideUp 0.25s ease-out',
        'scale-in':       'scaleIn 0.2s ease-out',
      },

      boxShadow: {
        'glow-accent': '0 0 24px rgba(var(--accent), 0.3)',
        card:          '0 1px 3px rgba(0,0,0,0.5)',
        'card-hover':  '0 4px 16px rgba(0,0,0,0.65)',
      },
    },
  },
  plugins: [],
};
