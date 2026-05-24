import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { formatPrice } from '../../../utils/formatters';
import { useSiteConfig } from '../../../contexts/SiteConfigContext';

export function CartDrawer() {
  const { items, isOpen, close, totalItems, subtotal } = useCart();
  const isMobile = useIsMobile();
  const siteConfig = useSiteConfig();

  const freeShippingThreshold = siteConfig.freeShippingThreshold;
  const emptyMessage  = siteConfig.cartEmptyMessage  ?? 'Your cart is empty';
  const emptyCtaLabel = siteConfig.cartEmptyCtaLabel ?? 'Start Shopping';
  const emptyCtaHref  = siteConfig.cartEmptyCtaHref  ?? '/shop';

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Lock scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Mobile drawer takes the full viewport — design decision, not a tunable.
  const isFullPage = isMobile;

  // Free shipping progress
  const remaining = freeShippingThreshold - subtotal;
  const freeShippingReached = subtotal >= freeShippingThreshold;
  const progressPct = freeShippingThreshold > 0
    ? Math.min(100, (subtotal / freeShippingThreshold) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-fade-in"
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel — pure black, white type, Nike-premium */}
      <aside
        className={[
          'relative ml-auto flex flex-col bg-black border-l border-white/10 text-white',
          'animate-slide-in-right',
          isFullPage ? 'w-full' : 'w-full sm:w-[400px] lg:w-[460px]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>

            <h2 className="font-sport text-2xl tracking-wide text-white uppercase">My Cart</h2>

            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent text-white text-[11px] font-bold leading-none">
                {totalItems}
              </span>
            )}
          </div>

          <button
            onClick={close}
            aria-label="Close cart"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4 animate-fade-in">
              <svg
                className="w-16 h-16 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>

              <div>
                <p className="font-sport text-3xl tracking-wide text-white uppercase">
                  {emptyMessage}
                </p>
                <p className="text-white/60 text-sm mt-2">
                  Add some fire to your wardrobe
                </p>
              </div>

              <Link to={emptyCtaHref} onClick={close}>
                <button className="mt-2 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm tracking-wider uppercase hover:bg-white/90 active:scale-95 transition-all">
                  {emptyCtaLabel}
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {items.map((item) => (
                <CartItem key={item.productVariantId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer — always shown so the checkout CTA is never hidden */}
        <div className="px-6 py-5 border-t border-white/10 shrink-0 bg-black space-y-4">
          {/* Free shipping progress — only when there are items */}
          {items.length > 0 && (
            <div>
              {freeShippingReached ? (
                <p className="text-xs text-ok font-bold uppercase tracking-wider mb-1.5">
                  Free shipping unlocked
                </p>
              ) : (
                <p className="text-xs text-white/70 mb-1.5">
                  <span className="text-accent font-bold">{formatPrice(remaining)}</span>
                  {' '}away from free shipping
                </p>
              )}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <CartSummary compact onCheckout={close} />
        </div>
      </aside>
    </div>
  );
}
