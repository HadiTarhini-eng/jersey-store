/**
 * Tailwind config — direct hex color tokens.
 *
 * Previously the theme was driven by CSS custom properties via a
 * `withOpacity` callback. That works in Tailwind 2.x but is fragile under
 * Tailwind 3's opacity-modifier pipeline (e.g. `bg-accent/30`) — depending
 * on the JIT cache state, the modifier can resolve to an empty value and
 * the rule never ships. Hex values eliminate that whole class of bugs:
 * `bg-accent` → `background-color: #007aff`, `bg-accent/30` →
 * `background-color: rgb(0 122 255 / 0.3)` — both handled natively.
 *
 * The CSS custom properties in src/index.css still exist (referenced by a
 * few inline styles), but the canonical source of truth for Tailwind
 * utility colors lives here.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  /**
   * Safelist — every semantic color across the utilities our runtime maps
   * pull from (status pills, toast variants, chip styles). The JIT scanner
   * already sees most of these in source, but safelisting guarantees they
   * ship in the built CSS even when the lookup pattern is nontrivial.
   */
  safelist: [
    // Premium blue
    'bg-accent', 'border-accent', 'text-accent',
    'shadow-accent/30', 'shadow-accent/40', 'shadow-accent/50',
    'bg-accent-light', 'border-accent-light',
    'bg-accent/10', 'bg-accent/20',
    'ring-accent', 'ring-accent/40',
    // Power orange
    'bg-power', 'border-power', 'text-power',
    'shadow-power/30', 'shadow-power/40',
    'bg-power-light', 'border-power-light',
    'bg-power/10', 'bg-power/20',
    // Green / delivered
    'bg-ok', 'border-ok', 'text-ok', 'shadow-ok/30',
    'bg-delivered', 'border-delivered', 'text-delivered', 'shadow-delivered/30',
    'bg-ok/10', 'bg-ok/20',
    // Red / danger
    'bg-danger', 'border-danger', 'text-danger',
    'shadow-danger/30', 'shadow-danger/40',
    'bg-danger/10', 'bg-danger/20',
    // Amber / caution
    'bg-caution', 'border-caution', 'text-caution', 'shadow-caution/30',
    'bg-caution/10', 'bg-caution/20',
    // Neutral grey (shipped status)
    'bg-gray-500', 'border-gray-500', 'text-gray-500', 'shadow-gray-500/30',
    // Toast entry animation utility — referenced via className string
    'animate-toast-in',
  ],

  theme: {
    extend: {
      colors: {
        // Single dark theme — all hex, fully deterministic.
        background:       '#08090a',  // near-black pitch
        surface:          '#111214',  // cards, panels
        'surface-raised': '#1a1b1f',  // dropdowns, tooltips
        primary:          '#f5f5f7',  // clean white
        secondary:        '#98989d',  // muted gray
        muted:            '#48484c',  // very muted
        stroke:           '#2c2c2e',  // borders/dividers

        // Semantic accents.
        accent: {
          DEFAULT: '#007aff',  // premium electric blue
          light:   '#409cff',
          dark:    '#000000',
        },
        power: {
          DEFAULT: '#ff4d00',  // fiery orange (prominent CTAs)
          light:   '#ff6633',
          dark:    '#000000',
        },
        ok:        '#34c759',
        delivered: '#34c759',
        danger:    '#ff3b30',
        caution:   '#ff9f0a',
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
        // Toast slides in from the right with a slight scale lift.
        toastIn: {
          from: { transform: 'translateX(110%) scale(0.96)', opacity: '0' },
          to:   { transform: 'translateX(0) scale(1)',       opacity: '1' },
        },
        // Time-to-dismiss progress bar — scales horizontally from full to empty.
        toastProgress: {
          from: { transform: 'scaleX(1)' },
          to:   { transform: 'scaleX(0)' },
        },
        // Order-confirmation: the SVG check path draws itself from start to end.
        drawCheck: {
          to: { strokeDashoffset: '0' },
        },
        // Subtle ring pulse around the green check circle on confirmation.
        confirmPulse: {
          '0%':   { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)',  opacity: '0'   },
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
        'toast-in':       'toastIn 0.32s cubic-bezier(0.16,1,0.3,1)',
        // toastProgress is invoked via inline style with the toast's duration.
        'draw-check':    'drawCheck 0.55s cubic-bezier(0.65,0,0.45,1) 0.15s forwards',
        'confirm-pulse': 'confirmPulse 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
      },

      boxShadow: {
        'glow-accent': '0 0 24px rgba(0,122,255,0.35)',
        'glow-power':  '0 0 24px rgba(255,77,0,0.35)',
        card:          '0 1px 3px rgba(0,0,0,0.6)',
        'card-hover':  '0 8px 24px rgba(0,0,0,0.7)',
        'card-accent': '0 4px 20px rgba(0,122,255,0.15)',
        'elevated':       '0 4px 20px rgba(0,0,0,0.45)',
        'elevated-hover': '0 18px 40px rgba(0,0,0,0.65)',
      },
    },
  },
  plugins: [],
};
