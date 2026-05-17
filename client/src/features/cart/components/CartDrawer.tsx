import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { theme } from '../../../config/theme';
import { formatPrice } from '../../../utils/formatters';
import uiConfig from '../../../data/ui-config.json';
import siteConfig from '../../../data/site-config.json';
import type { SiteConfig } from '../../../types';

const FREE_SHIPPING_THRESHOLD = (siteConfig as SiteConfig).freeShippingThreshold;

/**
 * On desktop: slides in from the right as a drawer.
 * On mobile: can be configured to be a full page (see ui-config.json cart.fullPageOnMobile).
 * Cart open/close state lives in Redux so any component can trigger it.
 */
export function CartDrawer() {
  const { items, isOpen, close, totalItems, subtotal } = useCart();
  const isMobile = useIsMobile();

  const { emptyMessage, emptyCtaLabel, emptyCtaHref } = uiConfig.cart;

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

  // On mobile (if configured), render as full-overlay instead of side drawer
  const isFullPage = isMobile && uiConfig.cart.fullPageOnMobile;

  // Free shipping progress
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const freeShippingReached = subtotal >= FREE_SHIPPING_THRESHOLD;
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/90 animate-fade-in"
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={[
          'relative ml-auto flex flex-col bg-surface-raised border-l border-stroke',
          'animate-slide-in-right',
          isFullPage ? 'w-full' : 'w-full sm:w-[400px] lg:w-[460px]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke shrink-0">
          <div className="flex items-center gap-3">
            {/* Shopping bag icon */}
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>

            <h2 className="font-sport text-xl tracking-wide text-primary uppercase">My Cart</h2>

            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-bold leading-none">
                {totalItems}
              </span>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={close}
            aria-label="Close cart"
            className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface-raised transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4 animate-fade-in">
              <svg
                className="w-16 h-16 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>

              <div>
                <p className="font-sport text-2xl tracking-wide text-primary uppercase">
                  {emptyMessage}
                </p>
                <p className="text-secondary text-sm mt-1.5">
                  Add some fire to your wardrobe
                </p>
              </div>

              <Link to={emptyCtaHref} onClick={close}>
                <button className={theme.btnPrimary}>{emptyCtaLabel}</button>
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem key={`${item.productId}-${item.size}`} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer — only when items exist */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-stroke shrink-0 bg-surface-raised space-y-4">
            {/* Free shipping progress */}
            <div>
              {freeShippingReached ? (
                <p className="text-xs text-ok font-medium mb-1.5">
                  Free shipping unlocked! 🎉
                </p>
              ) : (
                <p className="text-xs text-secondary mb-1.5">
                  <span className="text-accent font-semibold">{formatPrice(remaining)}</span>
                  {' '}away from free shipping!
                </p>
              )}
              <div className="h-1.5 bg-stroke rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Compact summary — total only */}
            <CartSummary compact onCheckout={close} />
          </div>
        )}
      </aside>
    </div>
  );
}
