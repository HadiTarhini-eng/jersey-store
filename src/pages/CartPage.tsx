import { Link } from 'react-router-dom';
import { useCart } from '../features/cart/hooks/useCart';
import { CartItem } from '../features/cart/components/CartItem';
import { CartSummary } from '../features/cart/components/CartSummary';
import { Button } from '../components/ui/Button';

/**
 * Full-page cart — used on mobile when ui-config.cart.fullPageOnMobile is true,
 * or accessible via /cart directly on all screen sizes.
 */
export function CartPage() {
  const { items } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
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
              <CartItem key={`${item.productId}-${item.size}`} item={item} />
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1 sticky top-24">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
