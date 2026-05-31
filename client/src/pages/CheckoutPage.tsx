import { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { CheckoutForm } from '../features/checkout/components/CheckoutForm';
import { OrderSummary } from '../features/checkout/components/OrderSummary';
import { CouponField } from '../features/checkout/components/CouponField';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { submitOrder, setStep, resetCheckout } from '../features/checkout/checkoutSlice';
import { formatDate, formatPrice } from '../utils/formatters';
import { ROUTES } from '../config/routes';
import { useSiteConfig } from '../contexts/SiteConfigContext';

/**
 * Strip everything except digits from a phone string — required by wa.me URLs.
 * Returns null when nothing remains so we hide the WhatsApp CTA gracefully.
 */
function phoneToWaNumber(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 ? digits : null;
}

export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const toast    = useToast();
  const { step, shippingAddress, order, loading, error } = useAppSelector((s) => s.checkout);
  const { items } = useAppSelector((s) => s.cart);

  // If the user returns to /checkout after a previously-completed order, the
  // slice still carries `step='confirmation'` and the old `order`. Reset on
  // mount when we see that combo + a fresh cart so the new flow starts clean.
  useEffect(() => {
    if (step === 'confirmation' && items.length > 0) {
      dispatch(resetCheckout());
    }
    // mount-only; deps left empty intentionally so a mid-session reset doesn't
    // re-fire this effect mid-flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) toast.push({ variant: 'error', title: 'Order failed', message: error });
  }, [error, toast]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Bounce back to /cart only on the FIRST render of this page — i.e. when
  // the user lands on /checkout with an empty cart. Without the ref gate,
  // state changes during the session (like resetCheckout firing right before
  // a Link navigates away to /orders) would cause CheckoutPage to briefly
  // re-render with `step='shipping'`+ empty cart and Navigate to /cart,
  // hijacking the intended destination.
  const initialMount = useRef(true);
  useEffect(() => { initialMount.current = false; }, []);
  if (initialMount.current && items.length === 0 && step === 'shipping') {
    return <Navigate to={ROUTES.CART} replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Progress indicator */}
      <nav className="flex items-center gap-2 mb-10" aria-label="Checkout steps">
        {(['shipping', 'review', 'confirmation'] as const).map((s, i) => {
          const reached = ['shipping', 'review', 'confirmation'].indexOf(step) >= i;
          const current = step === s;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                current  ? 'bg-accent text-white shadow-lg shadow-accent/30' :
                reached  ? 'bg-ok/20 text-ok' :
                'bg-surface-raised text-muted',
              ].join(' ')}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${current ? 'text-primary font-medium' : 'text-muted'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && <span className="text-stroke mx-1 hidden sm:block">→</span>}
            </div>
          );
        })}
      </nav>

      {/* ── Shipping step ─────────────────────────────────────── */}
      {step === 'shipping' && (
        <div className="max-w-2xl mx-auto">
          <CheckoutForm />
        </div>
      )}

      {/* ── Review step ───────────────────────────────────────── */}
      {step === 'review' && shippingAddress && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-surface rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-primary">Shipping to</h2>
              <button
                type="button"
                onClick={() => dispatch(setStep('shipping'))}
                className="text-xs font-bold uppercase tracking-wider text-accent hover:text-accent-light transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="text-sm text-secondary space-y-0.5">
              <p className="text-primary font-medium">{shippingAddress.fullName}</p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>
                {shippingAddress.city}
                {shippingAddress.state ? `, ${shippingAddress.state}` : ''}
                {shippingAddress.postalCode ? ` ${shippingAddress.postalCode}` : ''}
              </p>
              <p>{shippingAddress.country}</p>
              <p className="mt-1">{shippingAddress.phone}</p>
            </div>
          </div>

          <CouponField />

          <OrderSummary />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={() => dispatch(submitOrder(shippingAddress))}
          >
            Confirm Order
          </Button>
        </div>
      )}

      {/* ── Confirmation step ─────────────────────────────────── */}
      {step === 'confirmation' && order && (
        <ConfirmationView order={order} onContinueShopping={() => dispatch(resetCheckout())} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation — order summary + WhatsApp share
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmationViewProps {
  order: import('../types').Order;
  onContinueShopping: () => void;
}

function ConfirmationView({ order, onContinueShopping }: ConfirmationViewProps) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const siteConfig = useSiteConfig();
  const waNumber = phoneToWaNumber(siteConfig.phone ?? undefined);
  const waUrl    = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(buildWhatsAppMessage(order, siteConfig.name))}` : null;

  return (
    <div className="max-w-xl mx-auto text-center space-y-6 py-10">
      {/* Animated check — circle scales in, ring pulses outward, path draws itself. */}
      <div className="relative w-24 h-24 mx-auto">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-ok/30 animate-confirm-pulse"
        />
        <div className="relative w-24 h-24 rounded-full bg-ok flex items-center justify-center animate-scale-in shadow-lg shadow-ok/40">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            {/*
              Tailwind purges keyframes that no `animate-*` class references —
              the previous inline `animation: drawCheck …` style lost to that
              purge, leaving the path stuck at full dashoffset (invisible).
              Using the `animate-draw-check` class binds it correctly.
            */}
            <path
              d="M5 13l4 4L19 7"
              className="animate-draw-check"
              style={{ strokeDasharray: 22, strokeDashoffset: 22 }}
            />
          </svg>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-primary">Order sent!</h1>
        <p className="text-secondary mt-2 text-sm leading-relaxed">
          Thanks for your order. Send us a quick WhatsApp message and we'll confirm shipping details right away.
        </p>
      </div>

      <div className="bg-surface rounded-2xl p-5 text-left space-y-2 text-sm shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
        <Row label="Order ID"      value={<span className="text-primary font-mono">{order.orderNumber || order.id}</span>} />
        <Row label="Date"          value={<span className="text-primary">{formatDate(order.createdAt)}</span>} />
        <Row label="Subtotal"      value={<span className="text-primary">{formatPrice(order.subtotal ?? 0)}</span>} />
        <Row label="Total"         value={<span className="text-primary font-bold">{formatPrice(order.totalAmount ?? order.subtotal ?? 0)}</span>} />
        <Row label="Status"        value={<span className="text-ok font-medium capitalize">{order.status}</span>} />
      </div>

      <div className="flex flex-col gap-3">
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-ok text-white font-bold text-sm uppercase tracking-wider hover:bg-ok/90 shadow-lg shadow-ok/30 transition-colors"
          >
            <WhatsAppIcon />
            Message us on WhatsApp
          </a>
        ) : null}

        {isAuthenticated ? (
          // Signed-in customers get an in-app track-this-order shortcut. The
          // order is already saved against their userId via the auth-stamped
          // /orders/guest endpoint, so it shows up immediately in /orders.
          <Link to="/orders" onClick={onContinueShopping}>
            <Button variant="primary" size="lg" fullWidth>
              View order in My Orders
            </Button>
          </Link>
        ) : (
          // Guests can't track in-app — surface the friction and nudge sign-in.
          <div className="rounded-xl border border-stroke bg-surface-raised px-4 py-3 text-left text-xs text-secondary leading-relaxed">
            <p className="font-bold uppercase tracking-widest text-primary text-[10px] mb-1">Want to track this order in the app?</p>
            <p>
              You&apos;re checking out as a guest, so we can&apos;t link this order to an account.
              Next time, <Link to="/register" className="text-accent hover:text-accent-light underline-offset-2 hover:underline">create an account</Link>{' '}
              to see every order under{' '}
              <Link to="/orders" className="text-accent hover:text-accent-light underline-offset-2 hover:underline">My Orders</Link>.
              For now you can still reach us on WhatsApp for updates.
            </p>
          </div>
        )}

        <Link to="/shop" onClick={onContinueShopping}>
          <Button variant="ghost" size="lg" fullWidth>Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      {value}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.521.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.711.306 1.265.489 1.697.625.713.227 1.362.195 1.875.118.572-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

function buildWhatsAppMessage(order: import('../types').Order, siteName: string): string {
  const lines: string[] = [];
  lines.push(`Hi ${siteName}, I just placed order *${order.orderNumber || order.id}*.`);
  lines.push('');

  // Per-item lines — include custom printing details when present so the shop
  // knows exactly what to fulfil.
  const items = order.itemsSnapshot ?? [];
  if (items.length > 0) {
    lines.push('*Items*');
    for (const it of items) {
      const title  = it.productTitle ?? 'Item';
      const size   = it.variantLabel ? ` (${it.variantLabel})` : '';
      lines.push(`• ${title}${size} × ${it.quantity}`);
      if (it.customName || it.customNumber) {
        const bits = [
          it.customName ? `Name: ${it.customName}` : null,
          it.customNumber ? `Number: ${it.customNumber}` : null,
        ].filter(Boolean).join(' · ');
        lines.push(`   ↳ ${bits}`);
      }
    }
    lines.push('');
  }

  lines.push(`Subtotal: ${formatPrice(order.subtotal ?? 0)}`);
  if (order.discountAmount && order.discountAmount > 0) {
    const couponLabel = order.couponCode ? ` (${order.couponCode})` : '';
    lines.push(`Discount${couponLabel}: −${formatPrice(order.discountAmount)}`);
  }
  if (order.shippingAmount) lines.push(`Shipping: ${formatPrice(order.shippingAmount)}`);
  lines.push(`*Total: ${formatPrice(order.totalAmount ?? order.subtotal ?? 0)}*`);
  lines.push('');
  lines.push('*Ship to*');
  const a = order.shippingAddress;
  lines.push(a.fullName);
  lines.push(a.addressLine1);
  if (a.addressLine2) lines.push(a.addressLine2);
  lines.push([a.city, a.state, a.postalCode].filter(Boolean).join(', '));
  lines.push(a.country);
  lines.push(`Phone: ${a.phone}`);
  return lines.join('\n');
}
