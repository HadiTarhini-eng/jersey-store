import type { OrderStatus, PaymentStatus } from '../../types';

type AnyStatus = OrderStatus | PaymentStatus | 'active' | 'inactive';

const styles: Record<string, string> = {
  pending:    'bg-caution/15  text-caution  border-caution/30',
  confirmed:  'bg-accent/15   text-accent   border-accent/30',
  processing: 'bg-accent/15   text-accent   border-accent/30',
  shipped:    'bg-accent/15   text-accent   border-accent/30',
  delivered:  'bg-ok/15       text-ok       border-ok/30',
  cancelled:  'bg-danger/15   text-danger   border-danger/30',
  // payment
  paid:       'bg-ok/15       text-ok       border-ok/30',
  refunded:   'bg-danger/15   text-danger   border-danger/30',
  failed:     'bg-danger/15   text-danger   border-danger/30',
  authorized: 'bg-accent/15   text-accent   border-accent/30',
  // generic
  active:     'bg-ok/15       text-ok       border-ok/30',
  inactive:   'bg-white/5     text-muted    border-stroke',
};

interface OrderStatusBadgeProps {
  status: AnyStatus | string;
  className?: string;
}

/**
 * Pill badge that auto-picks the right tone for any order or payment
 * status string we throw at it. Reused on the customer Orders list,
 * detail page, and admin grids — pick a label, get the colour.
 */
/**
 * Customer-friendly labels.
 * - `shipped`   → "On route" (the value stays `shipped` on the wire).
 * - `confirmed` → "Processing" (we collapsed the admin confirm step into
 *   the customer-visible processing state; legacy `confirmed` orders still
 *   render correctly).
 */
const labels: Record<string, string> = {
  shipped:   'On route',
  confirmed: 'Processing',
};

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const key   = status.toLowerCase();
  const tone  = styles[key] ?? 'bg-white/5 text-muted border-stroke';
  const label = labels[key] ?? status;
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-1 rounded-full border',
        'text-[10px] font-bold uppercase tracking-widest',
        tone,
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
