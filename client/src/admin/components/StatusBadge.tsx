interface StatusBadgeProps {
  status: string;
  tone?:  'accent' | 'ok' | 'caution' | 'danger' | 'muted' | 'power';
}

const toneClasses: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  accent:  'bg-accent/15  text-accent  border-accent/30',
  ok:      'bg-ok/15      text-ok      border-ok/30',
  caution: 'bg-caution/15 text-caution border-caution/30',
  danger:  'bg-danger/15  text-danger  border-danger/30',
  power:   'bg-power/15   text-power   border-power/30',
  muted:   'bg-white/5    text-muted   border-stroke',
};

/**
 * Order status mapping — pick a sensible default tone if `tone` is omitted.
 * Lets pages just pass `status` and get the right colour automatically.
 */
const statusToTone: Record<string, StatusBadgeProps['tone']> = {
  pending:    'caution',
  processing: 'accent',
  shipped:    'accent',
  delivered:  'ok',
  cancelled:  'danger',
  paid:       'ok',
  refunded:   'danger',
  failed:     'danger',
  active:     'ok',
  inactive:   'muted',
  draft:      'muted',
  archived:   'muted',
};

export function StatusBadge({ status, tone }: StatusBadgeProps) {
  const resolved = tone ?? statusToTone[status.toLowerCase()] ?? 'muted';
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
        toneClasses[resolved],
      ].join(' ')}
    >
      {status}
    </span>
  );
}
