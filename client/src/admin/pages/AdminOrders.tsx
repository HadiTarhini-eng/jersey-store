import { useState } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { useAdminCollection } from '../hooks/useAdminCollection';
import ordersSeed from '../../data/admin/orders.json';
import type { AdminOrder } from '../../types';
import { formatPrice } from '../../utils/formatters';

const ordersSeedTyped = ordersSeed as AdminOrder[];

const statusFilters = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
type StatusFilter = typeof statusFilters[number];

// ─────────────────────────────────────────────────────────────────────────────
// Orders list
// ─────────────────────────────────────────────────────────────────────────────

export function AdminOrders() {
  const navigate = useNavigate();
  const { items: orders } = useAdminCollection<AdminOrder>('orders', ordersSeedTyped);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visible = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const columns: DataGridColumn<AdminOrder>[] = [
    {
      key: 'order',
      label: 'Order',
      render: (o) => (
        <div>
          <p className="font-bold text-primary tabular-nums">{o.orderNumber}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted mt-0.5">
            {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (o) => (
        <div className="min-w-0">
          <p className="text-primary truncate">{o.customer.name}</p>
          <p className="text-xs text-muted truncate">{o.customer.email}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (o) => <span className="text-secondary tabular-nums">{o.items.reduce((s, i) => s + i.quantity, 0)}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (o) => <span className="font-bold text-primary tabular-nums">{formatPrice(o.total)}</span>,
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (o) => <StatusBadge status={o.paymentStatus} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (o) => <StatusBadge status={o.status} />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        {statusFilters.map((s) => {
          const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                'shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors',
                active
                  ? 'bg-white text-black border-white'
                  : 'border-stroke text-secondary hover:text-primary hover:border-white/50',
              ].join(' ')}
            >
              {s}
              <span className={`tabular-nums ${active ? 'text-black/60' : 'text-muted'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <DataGrid<AdminOrder>
        rows={visible}
        columns={columns}
        rowKey={(o) => o.id}
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
        searchableText={(o) => `${o.orderNumber} ${o.customer.name} ${o.customer.email}`}
        searchPlaceholder="Search by order #, name, or email…"
        emptyMessage="No orders match this filter."
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order detail
// ─────────────────────────────────────────────────────────────────────────────

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

/** Per-status colour when the button is the active status. */
const statusSelectedClass: Record<typeof orderStatuses[number], string> = {
  pending:    'bg-black   text-white border-power   shadow-lg shadow-power/30',
  processing: 'bg-black  text-white border-accent  shadow-lg shadow-accent/30',
  shipped:    'bg-black text-white border-gray-500 shadow-lg shadow-gray-500/30',
  delivered:  'bg-black text-white border-delivered shadow-lg shadow-delivered/30',
  cancelled:  'bg-black  text-white border-danger  shadow-lg shadow-danger/30',
};

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { items: orders, update } = useAdminCollection<AdminOrder>('orders', ordersSeedTyped);
  const order = orders.find((o) => o.id === id);

  if (!order) return <Navigate to="/admin/orders" replace />;

  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-5">
      {/* ── Back + header ─────────────────────────────────────────────────── */}
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
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Items + addresses ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <section className="bg-surface border border-stroke rounded-2xl">
            <h3 className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-stroke">Line items</h3>
            <div className="divide-y divide-stroke">
              {order.items.map((it, i) => (
                <div key={`${it.productId}-${i}`} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{it.name}</p>
                    <p className="text-xs text-muted mt-0.5">Size {it.size} · Qty {it.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0 ml-3">
                    {formatPrice(it.price * it.quantity)}
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

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <section className="bg-surface border border-stroke rounded-2xl p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">Customer</h3>
            <p className="font-medium text-primary">{order.customer.name}</p>
            <p className="text-sm text-muted truncate">{order.customer.email}</p>
            <Link
              to="/admin/customers"
              className="inline-flex mt-3 text-xs font-bold uppercase tracking-widest text-accent hover:text-accent-light"
            >
              View customer →
            </Link>
          </section>

          <section className="bg-surface border border-stroke rounded-2xl p-5 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted">Update status</h3>
            <div className="grid grid-cols-2 gap-2">
              {orderStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => update(order.id, { status: s })}
                  className={[
                    'px-3 py-2 rounded-lg border-2 text-xs font-bold uppercase tracking-wider transition-colors',
                    order.status === s
                      ? statusSelectedClass[s]
                      : 'border-stroke text-secondary hover:text-primary hover:border-white/50',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
