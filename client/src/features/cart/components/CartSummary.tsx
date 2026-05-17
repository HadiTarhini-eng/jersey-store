import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import { theme } from '../../../config/theme';
import siteConfig from '../../../data/site-config.json';
import type { SiteConfig } from '../../../types';

interface CartSummaryProps {
  onCheckout?: () => void;
  /** Compact mode used inside the drawer — shows only totals, no breakdown */
  compact?: boolean;
}

export function CartSummary({ onCheckout, compact = false }: CartSummaryProps) {
  const { subtotal } = useCart();
  const { freeShippingThreshold, currency } = siteConfig as SiteConfig;

  const shipping          = subtotal >= freeShippingThreshold ? 0 : 9.99;
  const total             = subtotal + shipping;

  return (
    <div className="space-y-4">
      {compact ? (
        /* ── Compact mode: drawer footer — just total row + CTA ── */
        <>
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-primary">Total</span>
            <span className="text-base font-bold text-primary">{formatPrice(total, currency)}</span>
          </div>

          {onCheckout ? (
            <button className={`${theme.btnPrimary} w-full`} onClick={onCheckout}>
              Checkout →
            </button>
          ) : (
            <Link to="/checkout" className="block w-full">
              <button className={`${theme.btnPrimary} w-full`}>
                Checkout →
              </button>
            </Link>
          )}

          {onCheckout && (
            <div className="text-center">
              <button className={theme.btnGhost2} onClick={onCheckout}>
                Continue Shopping
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── Full mode: cart page — itemized breakdown ── */
        <>
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
            <button className={`${theme.btnPrimary} w-full`} onClick={onCheckout}>
              Checkout →
            </button>
          ) : (
            <Link to="/checkout" className="block w-full">
              <button className={`${theme.btnPrimary} w-full`}>
                Checkout →
              </button>
            </Link>
          )}

          <p className="text-xs text-muted text-center">
            Secure checkout · Taxes calculated at checkout
          </p>
        </>
      )}
    </div>
  );
}
