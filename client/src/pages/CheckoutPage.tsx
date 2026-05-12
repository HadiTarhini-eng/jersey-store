import { Link, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { CheckoutForm } from '../features/checkout/components/CheckoutForm';
import { OrderSummary } from '../features/checkout/components/OrderSummary';
import { Button } from '../components/ui/Button';
import { submitOrder } from '../features/checkout/checkoutSlice';
import { formatDate } from '../utils/formatters';
import { ROUTES } from '../config/routes';

export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const { step, shippingAddress, order, loading, error } = useAppSelector((s) => s.checkout);
  const { items } = useAppSelector((s) => s.cart);

  // Nothing to checkout
  if (items.length === 0 && step !== 'confirmation') {
    return <Navigate to={ROUTES.CART} replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Progress indicator */}
      <nav className="flex items-center gap-2 mb-10" aria-label="Checkout steps">
        {(['shipping', 'review', 'confirmation'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              step === s
                ? 'bg-accent text-accent-dark'
                : (['review', 'confirmation'].includes(step) && i < (['shipping', 'review', 'confirmation'].indexOf(step)))
                ? 'bg-ok/20 text-ok'
                : 'bg-surface-raised text-muted',
            ].join(' ')}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${step === s ? 'text-primary font-medium' : 'text-muted'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 2 && <span className="text-stroke mx-1 hidden sm:block">→</span>}
          </div>
        ))}
      </nav>

      {/* ── Shipping step ─────────────────────────────────────── */}
      {step === 'shipping' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <CheckoutForm />
          </div>
          <div className="sticky top-24">
            <OrderSummary />
          </div>
        </div>
      )}

      {/* ── Review step ───────────────────────────────────────── */}
      {step === 'review' && shippingAddress && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-2xl border border-stroke p-5">
              <h2 className="font-semibold text-primary mb-4">Shipping to</h2>
              <div className="text-sm text-secondary space-y-0.5">
                <p className="text-primary font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                <p>{shippingAddress.address}</p>
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                <p>{shippingAddress.country}</p>
                <p className="mt-1">{shippingAddress.phone}</p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => dispatch(submitOrder(shippingAddress))}
            >
              Place Order
            </Button>
          </div>
          <div className="sticky top-24">
            <OrderSummary />
          </div>
        </div>
      )}

      {/* ── Confirmation step ─────────────────────────────────── */}
      {step === 'confirmation' && order && (
        <div className="max-w-lg mx-auto text-center space-y-6 py-10">
          <div className="w-20 h-20 rounded-full bg-ok/10 flex items-center justify-center text-4xl mx-auto">
            ✅
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Order Confirmed!</h1>
            <p className="text-secondary mt-2 text-sm">
              Thank you for your order. We'll send a confirmation email shortly.
            </p>
          </div>
          <div className="bg-surface rounded-2xl border border-stroke p-5 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Order ID</span>
              <span className="text-primary font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Date</span>
              <span className="text-primary">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Status</span>
              <span className="text-ok font-medium capitalize">{order.status}</span>
            </div>
          </div>
          <Link to="/shop">
            <Button variant="primary" size="lg">Continue Shopping</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
