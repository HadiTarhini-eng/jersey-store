import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { adminApi } from '../services/adminApi';
import { orderApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type { AdminOrder } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { buildWhatsAppUrl, newOrderMessage, resolveFirstName } from '../../utils/waMessage';
import { useSiteConfig } from '../../contexts/SiteConfigContext';

const statusFilters = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
type StatusFilter = typeof statusFilters[number];
type OrderStatus = Exclude<StatusFilter, 'all'>;

/**
 * Strict transition graph mirrored from the backend
 * (api/src/infrastructure/services/commerce.svc.ts:ALLOWED_TRANSITIONS).
 * Drives the context-aware action buttons on the order detail page —
 * only legal next moves render.
 */
/**
 * Mirrors `ALLOWED_TRANSITIONS` on the backend. The admin confirms an order
 * by moving it directly from `pending → processing` — no separate "confirmed"
 * step. The `confirmed` row is a legacy fallback for orders predating this
 * workflow change.
 */
const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'cancelled'],
  delivered:  ['cancelled'],
  cancelled:  [],
  confirmed:  ['processing', 'shipped', 'cancelled'],
};

/** Customer-facing label for `shipped` is "On route". */
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  processing: 'Processing',
  shipped:    'On route',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

/**
 * Verb for the action button that moves the order INTO this status.
 * `processing` reads as "Confirm order" because pending → processing IS the
 * admin's confirmation step (we collapsed the separate `confirmed` state).
 */
const ACTION_LABEL: Record<OrderStatus, string> = {
  pending:    'Mark pending',
  confirmed:  'Mark confirmed',
  processing: 'Confirm order',
  shipped:    'Mark on route',
  delivered:  'Mark delivered',
  cancelled:  'Cancel order',
};

const ACTION_VARIANT: Record<OrderStatus, 'primary' | 'success' | 'danger'> = {
  pending:    'primary',
  confirmed:  'success',
  processing: 'success',
  shipped:    'primary',
  delivered:  'success',
  cancelled:  'danger',
};

/** Small colour-coded badge for payment status (Paid / Pending / Refunded / Failed). */
function PaymentBadge({ status }: { status: AdminOrder['paymentStatus'] }) {
  const styles: Record<string, string> = {
    paid:      'bg-delivered/15 text-delivered border-delivered/40',
    pending:   'bg-caution/15 text-caution border-caution/40',
    refunded:  'bg-muted/15 text-muted border-stroke',
    failed:    'bg-danger/15 text-danger border-danger/40',
    cancelled: 'bg-danger/15 text-danger border-danger/40',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}

export function AdminOrders() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const next = await adminApi.listOrders();
        if (!cancelled) setOrders(next);
      } catch (err) {
        if (!cancelled) push({ variant: 'error', message: extractErrorMessage(err, 'Failed to load orders') });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [push]);

  const visible = statusFilter === 'all'
    ? orders
    : orders.filter((order) => order.status === statusFilter);

  const columns: DataGridColumn<AdminOrder>[] = [
    {
      key: 'order',
      label: 'Order',
      render: (order) => (
        <div>
          <p className="font-bold text-primary tabular-nums">{order.orderNumber}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted mt-0.5">
            {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (order) => (
        <div className="min-w-0">
          <p className="text-primary truncate flex items-center gap-1.5">
            {order.customer.name || 'Guest'}
            {!order.customer.id && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-muted/20 text-muted border border-muted/30">
                Guest
              </span>
            )}
          </p>
          <p className="text-xs text-muted truncate">{order.customer.email ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (order) => <span className="text-secondary tabular-nums">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (order) => <span className="font-bold text-primary tabular-nums">{formatPrice(order.total)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (order) => <PaymentBadge status={order.paymentStatus} />,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        {statusFilters.map((status) => {
          const count = status === 'all' ? orders.length : orders.filter((order) => order.status === status).length;
          const active = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={[
                'shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors',
                active
                  ? 'bg-white text-black border-white'
                  : 'border-stroke text-secondary hover:text-primary hover:border-white/50',
              ].join(' ')}
            >
              {status === 'all' ? 'All' : STATUS_LABEL[status]}
              <span className={`tabular-nums ${active ? 'text-black/60' : 'text-muted'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-surface border border-stroke rounded-2xl px-4 py-10 text-center text-muted text-sm">
          Loading orders...
        </div>
      ) : (
        <DataGrid<AdminOrder>
          rows={visible}
          columns={columns}
          rowKey={(order) => order.id}
          onRowClick={(order) => navigate(`/admin/orders/${order.id}`)}
          searchableText={(order) => `${order.orderNumber} ${order.customer.name} ${order.customer.email ?? ''}`}
          searchPlaceholder="Search by order #, name, or email..."
          emptyMessage="No orders match this filter."
        />
      )}
    </div>
  );
}

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { push, promise } = useToast();
  const siteConfig = useSiteConfig();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    adminApi.getOrder(id)
      .then((next) => { if (!cancelled) setOrder(next); })
      .catch((err) => {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 404) setNotFound(true);
        else push({ variant: 'error', message: extractErrorMessage(err, 'Could not load order') });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, push]);

  if (notFound) return <Navigate to="/admin/orders" replace />;
  if (loading || !order) {
    return (
      <div className="bg-surface border border-stroke rounded-2xl px-4 py-10 text-center text-muted text-sm">
        Loading order…
      </div>
    );
  }

  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const currentStatus = order.status as OrderStatus;
  const nextOptions = ALLOWED_NEXT[currentStatus] ?? [];

  /**
   * Move the order into `next`. Cancellation always opens the reject modal
   * so the admin captures a reason; everything else fires straight through
   * with no extra confirmation (terminal moves like "delivered" are still
   * one-click but the action bar makes the verb explicit).
   */
  const onMoveStatus = (next: OrderStatus) => {
    if (next === 'cancelled') {
      setRejectOpen(true);
      return;
    }
    void promise(orderApi.updateStatus(order.id, next), {
      success: `Status set to ${STATUS_LABEL[next]}`,
      error:   (err) => extractErrorMessage(err, 'Could not update status'),
    }).then(() => {
      setOrder((current) => current ? { ...current, status: next, rejectionReason: null } : current);
    }).catch(() => undefined);
  };

  const onReject = async (reason: string) => {
    try {
      await promise(orderApi.updateStatus(order.id, 'cancelled', reason), {
        success: 'Order cancelled — customer will see your message',
        error:   (err) => extractErrorMessage(err, 'Could not cancel order'),
      });
      setOrder((current) => current ? { ...current, status: 'cancelled', rejectionReason: reason, adminMessageReadAt: null } : current);
      setRejectOpen(false);
    } catch {
      /* toast already shown */
    }
  };

  const onSetPayment = (paymentStatus: AdminOrder['paymentStatus']) => {
    void promise(orderApi.updatePayment(order.id, paymentStatus), {
      success: `Payment marked ${paymentStatus}`,
      error:   (err) => extractErrorMessage(err, 'Could not update payment'),
    }).then(() => {
      setOrder((current) => current ? { ...current, paymentStatus } : current);
    }).catch(() => undefined);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <Link to="/admin/orders" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
            ← All orders
          </Link>
          <h2 className="font-sport text-3xl tracking-wide text-primary uppercase">{order.orderNumber}</h2>
          <p className="text-sm text-secondary">
            Placed {new Date(order.createdAt).toLocaleString()} · {itemsCount} item{itemsCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section className="bg-surface border border-stroke rounded-2xl">
            <h3 className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-stroke">Line items</h3>
            <div className="divide-y divide-stroke">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{item.name}</p>
                    <p className="text-xs text-muted mt-0.5">Size {item.size} · Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0 ml-3">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-stroke space-y-1.5 text-sm">
              <div className="flex justify-between text-secondary">
                <span>Subtotal</span>
                <span className="tabular-nums text-primary">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Shipping</span>
                <span className="tabular-nums text-primary">{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold uppercase tracking-wider pt-2 border-t border-stroke">
                <span>Total</span>
                <span className="text-lg tabular-nums">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-stroke rounded-2xl p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">Shipping address</h3>
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
          </section>
        </div>

        <div className="space-y-5">
          <section className="bg-surface border border-stroke rounded-2xl p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
              Customer
              {!order.customer.id && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-muted/20 text-muted border border-muted/30">
                  Guest
                </span>
              )}
            </h3>
            <p className="font-medium text-primary">{order.customer.name || 'Guest'}</p>
            <p className="text-sm text-muted truncate">{order.customer.email ?? '—'}</p>
            <p className="text-xs text-muted mt-1">{order.shippingAddress.phone}</p>

            {/* Click-to-message via wa.me — opens a pre-filled WhatsApp draft
                so the admin can send a notification with one tap. Hidden when
                the customer's phone isn't usable. */}
            {(() => {
              const waUrl = buildWhatsAppUrl({
                phone:     order.shippingAddress.phone,
                firstName: resolveFirstName(order.shippingAddress),
                shopName:  siteConfig.name,
                message:   newOrderMessage(order.orderNumber, resolveFirstName(order.shippingAddress), siteConfig.name),
              });
              if (!waUrl) return null;
              return (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ok/15 border border-ok/40 text-ok text-xs font-bold uppercase tracking-wider hover:bg-ok/25 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z" />
                  </svg>
                  Notify on WhatsApp
                </a>
              );
            })()}

            {order.customer.id && (
              <div className="mt-2">
                <Link
                  to="/admin/customers"
                  className="inline-flex text-xs font-bold uppercase tracking-widest text-accent hover:text-accent-light"
                >
                  View customer →
                </Link>
              </div>
            )}
          </section>

          <section className="bg-surface border border-stroke rounded-2xl p-5 space-y-3">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted">Current status</h3>
              <p className="font-sport text-2xl text-primary tracking-wide mt-1">{STATUS_LABEL[currentStatus]}</p>
            </div>

            {nextOptions.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-stroke">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Next steps</p>
                {nextOptions.map((next) => {
                  const variant = ACTION_VARIANT[next];
                  const className = variant === 'success'
                    ? 'bg-delivered text-white hover:bg-delivered/90 border-delivered'
                    : variant === 'danger'
                    ? 'bg-transparent text-danger hover:bg-danger/10 border-danger'
                    : 'bg-accent text-white hover:bg-accent-light border-accent';
                  return (
                    <button
                      key={next}
                      type="button"
                      onClick={() => onMoveStatus(next)}
                      className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-bold uppercase tracking-wider transition-colors ${className}`}
                    >
                      {ACTION_LABEL[next]}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="pt-2 border-t border-stroke text-xs text-muted">
                This order is in a terminal state and can&apos;t be changed.
              </p>
            )}
          </section>

          {/* Payment status — admin marks an order paid/pending. Hidden once
              cancelled (the backend locks payment changes on cancelled orders). */}
          {order.status !== 'cancelled' && (
            <section className="bg-surface border border-stroke rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted">Payment</h3>
                <PaymentBadge status={order.paymentStatus} />
              </div>
              {order.paymentStatus !== 'paid' ? (
                <button
                  type="button"
                  onClick={() => onSetPayment('paid')}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-delivered bg-delivered text-white text-sm font-bold uppercase tracking-wider hover:bg-delivered/90 transition-colors"
                >
                  Mark as paid
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetPayment('pending')}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stroke text-secondary text-sm font-bold uppercase tracking-wider hover:text-primary hover:border-white/50 transition-colors"
                >
                  Mark as pending
                </button>
              )}
            </section>
          )}

          {order.rejectionReason && (
            <section className="bg-danger/10 border border-danger/40 rounded-2xl p-5 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-danger">Rejection message sent to customer</h3>
              <p className="text-sm text-primary whitespace-pre-line">{order.rejectionReason}</p>
              <p className="text-[10px] text-muted">
                {order.adminMessageReadAt
                  ? `Customer read this on ${new Date(order.adminMessageReadAt).toLocaleString()}`
                  : 'Not yet read by the customer.'}
              </p>
            </section>
          )}
        </div>
      </div>

      <RejectOrderModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={onReject}
      />
    </div>
  );
}

function RejectOrderModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (reason: string) => void | Promise<void> }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (!isOpen) setReason(''); }, [isOpen]);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 1000;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel order" maxWidth="max-w-md">
      <div className="space-y-3">
        <p className="text-sm text-secondary">
          The customer will see this message on their order page. Use it to explain why
          the order is being cancelled, or to suggest alternatives.
        </p>
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
            Message to customer
          </span>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1000))}
            rows={5}
            placeholder="e.g. We're out of stock in this size. Would you like a refund or to switch to size L?"
            className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-stroke text-primary text-sm outline-none focus:border-accent placeholder:text-muted/60 resize-y"
          />
          <span className="block text-[10px] text-muted mt-1">{trimmed.length} / 1000</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-muted hover:text-primary hover:bg-surface-raised transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void onSubmit(trimmed)}
          className="px-5 py-2.5 rounded-xl bg-danger text-white font-bold text-sm uppercase tracking-wider hover:bg-danger/90 shadow-lg shadow-danger/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel &amp; notify
        </button>
      </div>
    </Modal>
  );
}
