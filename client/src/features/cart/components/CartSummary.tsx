import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import siteConfig from '../../../data/site-config.json';
import type { SiteConfig } from '../../../types';

interface CartSummaryProps {
  onCheckout?: () => void;
  /** Compact mode used inside the drawer — hides some UI */
  compact?: boolean;
}

export function CartSummary({ onCheckout, compact = false }: CartSummaryProps) {
  const { subtotal } = useCart();
  const { freeShippingThreshold, currency } = siteConfig as SiteConfig;

  const shipping          = subtotal >= freeShippingThreshold ? 0 : 9.99;
  const total             = subtotal + shipping;
  const remainingForFree  = freeShippingThreshold - subtotal;
  const freeShippingReached = subtotal >= freeShippingThreshold;

  return (
    <div className="space-y-4">
      {/* Free shipping progress bar */}
      {!compact && (
        <div className="p-3.5 rounded-xl bg-surface-raised border border-stroke">
          {freeShippingReached ? (
            <p className="text-xs text-ok font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              You've unlocked free shipping!
            </p>
          ) : (
            <>
              <p className="text-xs text-secondary mb-2">
                Add <span className="text-accent font-semibold">{formatPrice(remainingForFree, currency)}</span> more for free shipping
              </p>
              <div className="h-1.5 bg-stroke rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Line items */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm text-secondary">
          <span>Subtotal</span>
          <span className="text-primary font-medium">{formatPrice(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between text-sm text-secondary">
          <span>Shipping</span>
          <span className={shipping === 0 ? 'text-ok font-medium' : 'text-primary font-medium'}>
            {shipping === 0 ? 'Free' : formatPrice(shipping, currency)}
          </span>
        </div>
        <div className="flex justify-between text-base font-semibold text-primary pt-2.5 border-t border-stroke">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
      </div>

      {/* CTA */}
      {onCheckout ? (
        <Button variant="primary" fullWidth size="lg" onClick={onCheckout}>
          Checkout
        </Button>
      ) : (
        <Link to="/checkout">
          <Button variant="primary" fullWidth size="lg">
            Checkout
          </Button>
        </Link>
      )}

      {!compact && (
        <p className="text-xs text-muted text-center">
          Secure checkout · Taxes calculated at checkout
        </p>
      )}
    </div>
  );
}
