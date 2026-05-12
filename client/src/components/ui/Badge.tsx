import type { ReactNode } from 'react';

type BadgeVariant = 'accent' | 'new' | 'sale' | 'limited' | 'ok' | 'caution' | 'danger' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent:  'bg-accent/15 text-accent border border-accent/30',
  new:     'bg-ok/10 text-ok border border-ok/30',
  sale:    'bg-danger/10 text-danger border border-danger/30',
  limited: 'bg-accent/15 text-accent border border-accent/30',
  ok:      'bg-ok/10 text-ok border border-ok/30',
  caution: 'bg-caution/10 text-caution border border-caution/30',
  danger:  'bg-danger/10 text-danger border border-danger/30',
  neutral: 'bg-surface-raised text-secondary border border-stroke',
};

/** Maps the badge strings stored in product JSON to a variant. */
export const badgeToVariant = (badge?: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    New: 'new', Sale: 'sale', Limited: 'limited',
  };
  return map[badge ?? ''] ?? 'neutral';
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
