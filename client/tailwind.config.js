/**
 * Tailwind config — semantic CSS-variable-backed color tokens.
 * To retheme: update the CSS custom properties in src/index.css only.
 * All colors support Tailwind's opacity modifier (e.g. bg-accent/50)
 * via the RGB-channel variable pattern.
 */

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
        power: {
          DEFAULT: withOpacity('--power'),
          light:   withOpacity('--power-light'),
          dark:    withOpacity('--power-dark'),
        },
        danger:  withOpacity('--danger'),
        ok:      withOpacity('--ok'),
        caution: withOpacity('--caution'),
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Inter', 'sans-serif'],
        sport:   ['Bebas Neue', 'Inter', 'sans-serif'],
      },

      screens: { xs: '480px' },

      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        slideInLeft:  { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        slideUp:      { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:      { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        marquee:      { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shimmer:      { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        float:        { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseGlow:    {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,77,0,0.4), 0 0 40px rgba(255,77,0,0.1)' },
          '50%':      { boxShadow: '0 0 30px rgba(255,77,0,0.7), 0 0 60px rgba(255,77,0,0.3)' },
        },
        glowAccent: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(0,122,255,0.3)' },
          '50%':      { boxShadow: '0 0 32px rgba(0,122,255,0.6)' },
        },
      },

      animation: {
        'fade-in':        'fadeIn 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-left':  'slideInLeft 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':       'slideUp 0.3s ease-out',
        'scale-in':       'scaleIn 0.2s ease-out',
        'marquee':        'marquee 30s linear infinite',
        'shimmer':        'shimmer 1.4s infinite',
        'float':          'float 3s ease-in-out infinite',
        'pulse-glow':     'pulseGlow 2s ease-in-out infinite',
        'glow-accent':    'glowAccent 2s ease-in-out infinite',
      },

      boxShadow: {
        'glow-accent': '0 0 24px rgba(0,122,255,0.35)',
        'glow-power':  '0 0 24px rgba(255,77,0,0.35)',
        card:          '0 1px 3px rgba(0,0,0,0.6)',
        'card-hover':  '0 8px 24px rgba(0,0,0,0.7)',
        'card-accent': '0 4px 20px rgba(0,122,255,0.15)',
      },
    },
  },
  plugins: [],
};
