/**
 * Shared Tailwind class strings for common UI patterns.
 * Centralised here so a design change touches one file.
 * Tailwind scans this file at build time via the content glob.
 */

export const theme = {
  /** Primary CTA — Electric Blue */
  btnPrimary: [
    'inline-flex items-center justify-center gap-2',
    'px-6 py-3 rounded-xl',
    'bg-accent text-white font-semibold text-sm tracking-wide',
    'hover:bg-accent-light active:scale-95',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
    'focus-accent',
  ].join(' '),

  /** Power CTA — Fiery Orange (Design Your Own, hero CTAs) */
  btnPower: [
    'inline-flex items-center justify-center gap-2',
    'px-8 py-4 rounded-xl',
    'bg-power text-white font-bold text-base tracking-wide uppercase',
    'hover:bg-power-light active:scale-95',
    'shadow-glow-power',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
    'focus-power',
  ].join(' '),

  /** Ghost / outlined button */
  btnGhost: [
    'inline-flex items-center justify-center gap-2',
    'px-6 py-3 rounded-xl',
    'border border-stroke text-primary font-medium text-sm',
    'hover:border-accent hover:text-accent',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'focus-accent',
  ].join(' '),

  /** Subtle / text-only button */
  btnGhost2: [
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2 rounded-lg',
    'text-secondary text-sm font-medium',
    'hover:text-primary hover:bg-surface',
    'transition-all duration-150',
    'focus-accent',
  ].join(' '),

  /** Standard card */
  card: [
    'bg-surface rounded-2xl border border-stroke',
    'shadow-card',
    'transition-shadow duration-200',
  ].join(' '),

  /** Hoverable card */
  cardHover: [
    'bg-surface rounded-2xl border border-stroke',
    'shadow-card hover:shadow-card-hover hover:border-accent/20',
    'transition-all duration-300',
  ].join(' '),

  /** Form input */
  input: [
    'w-full px-4 py-3 rounded-xl',
    'bg-surface border border-stroke',
    'text-primary placeholder:text-muted text-sm',
    'hover:border-accent/50 focus:border-accent',
    'outline-none transition-colors duration-150',
  ].join(' '),

  /** Sport display heading (Bebas Neue) */
  sectionTitle: 'font-sport text-3xl md:text-4xl lg:text-5xl tracking-wide text-primary uppercase',
  sectionSubtitle: 'text-secondary text-sm md:text-base mt-1 font-sans',

  /** Page wrapper */
  pageContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  /** Divider */
  divider: 'border-t border-stroke',

  /** Badge pill */
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
} as const;
