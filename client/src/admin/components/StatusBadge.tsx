interface StatusBadgeProps {
  status: string;
  tone?:  'accent' | 'ok' | 'caution' | 'danger' | 'muted' | 'power';
  /** Override the rendered text — useful for renaming e.g. `shipped` → "On route". */
  label?: string;
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
  confirmed:  'accent',
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

const statusToLabel: Record<string, string> = {
  shipped:   'On route',
};

export function StatusBadge({ status, tone, label }: StatusBadgeProps) {
  const resolved = tone ?? statusToTone[status.toLowerCase()] ?? 'muted';
  const text     = label ?? statusToLabel[status.toLowerCase()] ?? status;
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
        toneClasses[resolved],
      ].join(' ')}
    >
      {text}
    </span>
  );
}
