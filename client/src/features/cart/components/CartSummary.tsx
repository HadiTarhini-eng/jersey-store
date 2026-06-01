import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import { useSiteConfig } from '../../../contexts/SiteConfigContext';

interface CartSummaryProps {
  /** Fired after the user clicks Checkout — used by the drawer to close itself. */
  onCheckout?: () => void;
  /** Compact mode used inside the drawer — shows only totals, no breakdown */
  compact?: boolean;
}

const checkoutBtn = [
  'w-full flex items-center justify-center gap-2',
  'px-6 py-4 rounded-2xl',
  'bg-white text-black font-black text-base tracking-widest uppercase',
  'border-2 border-white',
  'hover:bg-black hover:text-white',
  'active:scale-[0.98] transition-colors duration-200',
  'focus-accent',
].join(' ');

function CheckoutArrow() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

export function CartSummary({ onCheckout, compact = false }: CartSummaryProps) {
  const navigate = useNavigate();
  const { subtotal, items } = useCart();
  const { currency } = useSiteConfig();

  // Shipping isn't charged in the cart — it's computed at checkout once a
  // delivery address is entered (and can be waived by a free-delivery coupon).
  const total    = subtotal;
  const disabled = items.length === 0;

  const goToCheckout = () => {
    onCheckout?.();        // close drawer if open
    navigate('/checkout'); // then navigate
  };

  const checkoutButton = (
    <button
      type="button"
      onClick={goToCheckout}
      disabled={disabled}
      className={`${checkoutBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      Checkout <CheckoutArrow />
    </button>
  );

  return (
    <div className="space-y-4">
      {compact ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold uppercase tracking-wider text-white/80">Total</span>
            <span className="text-xl font-black text-white">{formatPrice(total, currency)}</span>
          </div>

          {checkoutButton}

          {onCheckout && (
            <button
              type="button"
              className="w-full text-xs uppercase tracking-widest text-white/60 hover:text-white py-1 transition-colors"
              onClick={onCheckout}
            >
              Continue Shopping
            </button>
          )}
        </>
      ) : (
        <div className="bg-surface rounded-2xl border border-stroke p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Order Summary</h2>

          <div className="space-y-2.5">
            <div className="flex justify-between text-sm text-secondary">
              <span>Subtotal</span>
              <span className="text-primary font-medium">{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-secondary">
              <span>Shipping</span>
              <span className="text-muted text-xs">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-base font-bold uppercase tracking-wider text-primary pt-3 border-t border-stroke">
              <span>Subtotal</span>
              <span className="text-xl font-black">{formatPrice(total, currency)}</span>
            </div>
          </div>

          {checkoutButton}

          <p className="text-[10px] uppercase tracking-widest text-muted text-center">
            Secure checkout · Taxes calculated at next step
          </p>
        </div>
      )}
    </div>
  );
}
