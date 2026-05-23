import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { customerOrderService, type CustomerOrder } from '../services/customerOrderService';
import { formatPrice, formatDate } from '../utils/formatters';
import { theme } from '../config/theme';
import { OrderStatusBadge } from '../features/orders/OrderStatusBadge';
import type { OrderStatus } from '../types';

// Linear progression of order statuses for the timeline. "cancelled" is
// surfaced separately (red banner) since it isn't part of the happy path.
const TIMELINE: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<CustomerOrder | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!id) { setOrder(null); return; }
    (async () => {
      const next = await customerOrderService.findById(id);
      if (!cancelled) setOrder(next);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (order === undefined) {
    return (
      <main className={`${theme.pageContainer} py-8 lg:py-12 space-y-4`}>
        <div className="h-8 w-48 shimmer rounded" />
        <div className="h-32 shimmer rounded-2xl" />
        <div className="h-64 shimmer rounded-2xl" />
      </main>
    );
  }

  if (!order) return <Navigate to="/orders" replace />;

  const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const isCancelled = order.status === 'cancelled';
  // Where we are along the happy-path timeline.
  const stepIndex = TIMELINE.indexOf(order.status as OrderStatus);

  return (
    <main className={`${theme.pageContainer} py-8 lg:py-12 space-y-6`}>
      {/* Back + header */}
      <div className="space-y-1">
        <Link to="/orders" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
          ← All orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-3">
          <div>
            <h1 className="text-3xl font-bold text-primary tabular-nums">{order.orderNumber}</h1>
            <p className="text-sm text-muted">
              Placed {formatDate(order.createdAt)} · {itemsCount} item{itemsCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.paymentStatus} />
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Status timeline — or cancellation banner */}
      {isCancelled ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5">
          <p className="text-sm font-bold uppercase tracking-wider text-danger">Order cancelled</p>
          <p className="text-sm text-secondary mt-1">
            This order was cancelled. If you were charged, a refund has been issued.
          </p>
        </div>
      ) : (
        <StatusTimeline currentIndex={stepIndex} estimatedDelivery={order.estimatedDelivery} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items + totals */}
        <div className="lg:col-span-2 space-y-5">
          <section className={`${theme.cardElevated}`}>
            <h2 className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-stroke">
              Items
            </h2>
            <div className="divide-y divide-stroke">
              {order.items.map((item, i) => (
                <div key={`${item.productId}-${i}`} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-14 h-14 rounded-xl bg-surface-raised overflow-hidden shrink-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{item.name}</p>
                    <p className="text-xs text-muted mt-0.5">Size {item.size} · Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-stroke space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Shipping" value={order.shipping === 0 ? 'Free' : formatPrice(order.shipping)} />
              <div className="flex justify-between font-bold uppercase tracking-wider text-primary pt-3 border-t border-stroke">
                <span>Total</span>
                <span className="text-lg tabular-nums">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Shipping address */}
        <aside className={`${theme.cardElevated} p-5`}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">Shipping to</h2>
          <div className="text-sm text-primary space-y-0.5">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>
              {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
              {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
            </p>
            <p>{order.shippingAddress.country}</p>
            <p className="mt-2 text-muted">{order.shippingAddress.phone}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-secondary">
      <span>{label}</span>
      <span className="tabular-nums text-primary">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status timeline — fills steps in green up to the current state.
// ─────────────────────────────────────────────────────────────────────────────

function StatusTimeline({ currentIndex, estimatedDelivery }: { currentIndex: number; estimatedDelivery?: string }) {
  // Treat unknown statuses as "pending".
  const idx = currentIndex < 0 ? 0 : currentIndex;

  return (
    <section className={`${theme.cardElevated} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted">Order status</h2>
        {estimatedDelivery && idx < TIMELINE.length - 1 && (
          <p className="text-xs text-muted">
            Est. delivery <span className="text-primary font-medium">{formatDate(estimatedDelivery)}</span>
          </p>
        )}
      </div>

      <ol className="flex items-start justify-between gap-2 relative">
        {/* Background rail */}
        <span className="absolute left-3 right-3 top-3 h-0.5 bg-stroke" aria-hidden="true" />
        {/* Filled rail (covers up to current step) */}
        <span
          className="absolute left-3 top-3 h-0.5 bg-ok transition-all duration-500"
          style={{ width: `calc(${(idx / (TIMELINE.length - 1)) * 100}% - 1.5rem)` }}
          aria-hidden="true"
        />

        {TIMELINE.map((step, i) => {
          const reached = i <= idx;
          const isNow   = i === idx;
          return (
            <li key={step} className="relative z-10 flex flex-col items-center text-center gap-1.5 min-w-0">
              <span
                className={[
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors',
                  reached
                    ? 'bg-ok border-ok text-white'
                    : 'bg-surface border-stroke text-muted',
                  isNow ? 'ring-4 ring-ok/25' : '',
                ].join(' ')}
              >
                {reached ? '✓' : i + 1}
              </span>
              <span
                className={[
                  'text-[10px] uppercase tracking-widest font-bold capitalize',
                  reached ? 'text-primary' : 'text-muted',
                ].join(' ')}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
