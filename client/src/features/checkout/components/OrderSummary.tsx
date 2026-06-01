import { useCart } from '../../cart/hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import { useSiteConfig } from '../../../contexts/SiteConfigContext';
import { useAppSelector } from '../../../app/hooks';

export function OrderSummary() {
  const { items, subtotal } = useCart();
  const { freeShippingThreshold, shippingFee, currency } = useSiteConfig();
  const coupon = useAppSelector((s) => s.checkout.coupon);

  // Shipping fee is admin-configured and only applied here at checkout. Waived
  // when the order clears the free-shipping threshold, or by a free-delivery
  // coupon.
  const qualifiesFree  = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const freeByCoupon   = !!coupon?.freeShipping;
  const shipping       = (qualifiesFree || freeByCoupon) ? 0 : (shippingFee ?? 0);
  const discountAmount = coupon && !coupon.freeShipping ? Math.min(subtotal, coupon.amount) : 0;
  const total          = Math.max(0, subtotal - discountAmount) + shipping;

  return (
    <div className="bg-surface rounded-2xl border border-stroke p-5 space-y-4">
      <h2 className="font-semibold text-primary">Order Summary</h2>

      <div className="space-y-3 max-h-60 overflow-y-auto hide-scrollbar">
        {items.map((item) => {
          const title = item.productTitle ?? 'Item';
          return (
            <div key={item.productVariantId} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-raised shrink-0 overflow-hidden border border-stroke">
                {item.image && (
                  <img
                    src={item.image}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary font-medium line-clamp-1">{title}</p>
                <p className="text-xs text-muted">
                  {item.variantLabel ? `${item.variantLabel} · ` : ''}Qty: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium text-primary shrink-0">
                {formatPrice(item.priceAtTime * item.quantity, currency)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-stroke pt-4 space-y-2">
        <div className="flex justify-between text-sm text-secondary">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        {coupon && discountAmount > 0 && (
          <div className="flex justify-between text-sm text-ok">
            <span>
              Discount
              <span className="text-muted ml-2 font-mono text-xs">({coupon.code})</span>
            </span>
            <span>−{formatPrice(discountAmount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-secondary">
          <span>
            Shipping
            {freeByCoupon && <span className="text-muted ml-2 font-mono text-xs">({coupon!.code})</span>}
          </span>
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
