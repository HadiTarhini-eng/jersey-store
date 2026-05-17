import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../features/cart/hooks/useCart';
import { CartItem } from '../features/cart/components/CartItem';
import { CartSummary } from '../features/cart/components/CartSummary';
import { Button } from '../components/ui/Button';
import { formatPrice } from '../utils/formatters';

/**
 * Full-page cart — used on mobile when ui-config.cart.fullPageOnMobile is true,
 * or accessible via /cart directly on all screen sizes.
 */
export function CartPage() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-32 lg:pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-primary mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-64 gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-raised flex items-center justify-center text-4xl">
            🛍
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary">Your cart is empty</h2>
            <p className="text-secondary text-sm mt-1">Add some jerseys to get started.</p>
          </div>
          <Link to="/shop">
            <Button variant="primary">Shop Now</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items list */}
          <div className="lg:col-span-2 bg-surface rounded-2xl border border-stroke divide-y divide-stroke p-5">
            {items.map((item) => (
              <CartItem key={item.productVariantId} item={item} />
            ))}
          </div>

          {/* Summary — desktop sidebar (mobile users get the sticky bar below) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <CartSummary />
          </div>
        </div>
      )}

      {/* Mobile sticky checkout bar — always visible at the bottom on mobile */}
      {items.length > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-black border-t-2 border-white/15 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-white/60">Total</p>
            <p className="text-lg font-black text-white">{formatPrice(subtotal)}</p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="flex-1 px-5 py-3 rounded-xl bg-white text-black font-black text-sm tracking-widest uppercase border-2 border-white active:scale-[0.98] transition-transform"
          >
            Checkout →
          </button>
        </div>
      )}
    </div>
  );
}
