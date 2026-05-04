import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Button } from '../../../components/ui/Button';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import uiConfig from '../../../data/ui-config.json';

/**
 * On desktop: slides in from the right as a drawer.
 * On mobile: can be configured to be a full page (see ui-config.json cart.fullPageOnMobile).
 * Cart open/close state lives in Redux so any component can trigger it.
 */
export function CartDrawer() {
  const { items, isOpen, close, totalItems } = useCart();
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

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={[
          'relative ml-auto flex flex-col bg-surface border-l border-stroke',
          'animate-slide-in-right',
          isFullPage ? 'w-full' : 'w-full sm:w-96 lg:w-[440px]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stroke shrink-0">
          <h2 className="font-semibold text-primary">
            Cart{totalItems > 0 && <span className="text-muted font-normal ml-2">({totalItems})</span>}
          </h2>
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
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center text-2xl">
                🛍
              </div>
              <div>
                <p className="text-primary font-medium">{emptyMessage}</p>
                <p className="text-muted text-sm mt-1">Looks like you haven't added anything yet.</p>
              </div>
              <Link to={emptyCtaHref} onClick={close}>
                <Button variant="ghost" size="sm">{emptyCtaLabel}</Button>
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

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-stroke shrink-0 bg-surface">
            <CartSummary onCheckout={close} compact />
          </div>
        )}
      </aside>
    </div>
  );
}
