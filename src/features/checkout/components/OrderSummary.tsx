import { useCart } from '../../cart/hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import siteConfig from '../../../data/site-config.json';
import type { SiteConfig } from '../../../types';

export function OrderSummary() {
  const { items, subtotal } = useCart();
  const { freeShippingThreshold, currency } = siteConfig as SiteConfig;

  const shipping = subtotal >= freeShippingThreshold ? 0 : 9.99;
  const total    = subtotal + shipping;

  return (
    <div className="bg-surface rounded-2xl border border-stroke p-5 space-y-4">
      <h2 className="font-semibold text-primary">Order Summary</h2>

      {/* Items */}
      <div className="space-y-3 max-h-60 overflow-y-auto hide-scrollbar">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-surface-raised shrink-0 overflow-hidden border border-stroke">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-primary font-medium line-clamp-1">{item.name}</p>
              <p className="text-xs text-muted">Size: {item.size} · Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-primary shrink-0">
              {formatPrice(item.price * item.quantity, currency)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-stroke pt-4 space-y-2">
        <div className="flex justify-between text-sm text-secondary">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between text-sm text-secondary">
          <span>Shipping</span>
          <span className={shipping === 0 ? 'text-ok' : ''}>
            {shipping === 0 ? 'Free' : formatPrice(shipping, currency)}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-primary pt-2 border-t border-stroke">
          <span>Total</span>
          <span className="text-lg">{formatPrice(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
