import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerOrderService, type CustomerOrder } from '../services/customerOrderService';
import { formatPrice, formatDate } from '../utils/formatters';
import { theme } from '../config/theme';
import { OrderStatusBadge } from '../features/orders/OrderStatusBadge';
import { useAuth } from '../features/auth/hooks/useAuth';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const next = await customerOrderService.list(user.id);
      if (!cancelled) {
        setOrders(next);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <main className={`${theme.pageContainer} py-8 lg:py-12 space-y-6`}>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Orders</h1>
        <p className="text-sm text-muted mt-1">
          Track everything you've ordered — status updates as your package moves.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => <OrderRow key={order.id} order={order} />)}
        </div>
      )}
    </main>
  );
}

function OrderRow({ order }: { order: CustomerOrder }) {
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const firstImage = order.items[0]?.image;

  return (
    <Link
      to={`/orders/${order.id}`}
      className={[
        theme.cardElevated,
        'p-4 sm:p-5 flex items-center gap-4',
        'group',
      ].join(' ')}
    >
      {/* Thumbnail of the first item */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-raised overflow-hidden shrink-0">
        {firstImage && (
          <img
            src={firstImage}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-[10px] uppercase tracking-widest text-muted font-bold">
            {order.orderNumber}
          </p>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm sm:text-base font-semibold text-primary truncate group-hover:text-accent transition-colors">
          {order.items[0]?.name ?? 'Order'}
          {order.items.length > 1 && (
            <span className="text-muted font-normal"> + {order.items.length - 1} more</span>
          )}
        </p>
        <div className="flex items-center justify-between gap-3 mt-1.5">
          <p className="text-xs text-muted">
            {formatDate(order.createdAt)} · {totalItems} item{totalItems !== 1 ? 's' : ''}
          </p>
          <p className="text-sm font-bold text-primary tabular-nums">
            {formatPrice(order.total)}
          </p>
        </div>
      </div>

      <svg className="w-5 h-5 text-muted shrink-0 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className={`${theme.cardElevated} p-12 text-center`}>
      <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-primary">No orders yet</h2>
      <p className="text-sm text-muted mt-1 mb-5">When you place your first order, it'll show up here.</p>
      <Link to="/shop" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-wider border-2 border-accent hover:bg-accent-light transition-colors">
        Start shopping
      </Link>
    </div>
  );
}
