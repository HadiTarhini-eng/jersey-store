/**
 * Shared Tailwind class strings for common UI patterns.
 * Centralised here so a design change touches one file.
 *
 * These are plain strings — Tailwind scans them at build time because
 * this file is included in the `content` glob in tailwind.config.js.
 */

export const theme = {
  /** Primary call-to-action button */
  btnPrimary: [
    'inline-flex items-center justify-center gap-2',
    'px-6 py-3 rounded-lg',
    'bg-accent text-accent-dark font-semibold text-sm tracking-wide',
    'hover:bg-accent-light active:scale-95',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
    'focus-accent',
  ].join(' '),

  /** Ghost / outlined button */
  btnGhost: [
    'inline-flex items-center justify-center gap-2',
    'px-6 py-3 rounded-lg',
    'border border-stroke text-primary font-medium text-sm',
    'hover:border-accent hover:text-accent',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'focus-accent',
  ].join(' '),

  /** Subtle / text-only button */
  btnGhost2: [
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2 rounded-md',
    'text-secondary text-sm font-medium',
    'hover:text-primary hover:bg-surface',
    'transition-all duration-150',
    'focus-accent',
  ].join(' '),

  /** Standard card */
  card: [
    'bg-surface rounded-xl border border-stroke',
    'shadow-card',
    'transition-shadow duration-200',
  ].join(' '),

  /** Hoverable card */
  cardHover: [
    'bg-surface rounded-xl border border-stroke',
    'shadow-card hover:shadow-card-hover hover:border-accent/30',
    'transition-all duration-200',
  ].join(' '),

  /** Form input */
  input: [
    'w-full px-4 py-3 rounded-lg',
    'bg-surface border border-stroke',
    'text-primary placeholder:text-muted text-sm',
    'hover:border-accent/50 focus:border-accent',
    'outline-none transition-colors duration-150',
  ].join(' '),

  /** Section heading */
  sectionTitle: 'text-2xl md:text-3xl font-bold tracking-tight text-primary',
  sectionSubtitle: 'text-secondary text-sm md:text-base mt-1',

  /** Page wrapper */
  pageContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  /** Divider */
  divider: 'border-t border-stroke',

  /** Badge pill */
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
} as const;
