import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { adminApi } from '../services/adminApi';
import { orderApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { useToast } from '../../components/ui/Toast';
import type { AdminOrder } from '../../types';
import { formatPrice } from '../../utils/formatters';

const statusFilters = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
type StatusFilter = typeof statusFilters[number];
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const statusSelectedClass: Record<typeof orderStatuses[number], string> = {
  pending:    'bg-black text-white border-power shadow-lg shadow-power/30',
  processing: 'bg-black text-white border-accent shadow-lg shadow-accent/30',
  shipped:    'bg-black text-white border-gray-500 shadow-lg shadow-gray-500/30',
  delivered:  'bg-black text-white border-delivered shadow-lg shadow-delivered/30',
  cancelled:  'bg-black text-white border-danger shadow-lg shadow-danger/30',
};

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
          <p className="text-primary truncate">{order.customer.name}</p>
          <p className="text-xs text-muted truncate">{order.customer.email}</p>
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
      key: 'payment',
      label: 'Payment',
      render: (order) => <StatusBadge status={order.paymentStatus} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
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
              {status}
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
          searchableText={(order) => `${order.orderNumber} ${order.customer.name} ${order.customer.email}`}
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
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const onStatusChange = (status: typeof orderStatuses[number]) => {
    void promise(orderApi.updateStatus(order.id, status), {
      success: `Status set to ${status}`,
      error:   (err) => extractErrorMessage(err, 'Could not update status'),
    }).then(() => {
      setOrder((current) => current ? { ...current, status } : current);
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
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.status} />
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
              {orderStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={[
                    'px-3 py-2 rounded-lg border-2 text-xs font-bold uppercase tracking-wider transition-colors',
                    order.status === status
                      ? statusSelectedClass[status]
                      : 'border-stroke text-secondary hover:text-primary hover:border-white/50',
                  ].join(' ')}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
