import { useState } from 'react';
import { useUiContentSlot } from '../../../hooks/useUiContentSlot';
import { useToast } from '../../../components/ui/Toast';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { useCart } from '../../cart/hooks/useCart';
import { applyCoupon, removeCoupon } from '../checkoutSlice';
import { formatPrice } from '../../../utils/formatters';
import type { CouponPayload } from '../../../types';

/**
 * Compute the discount amount in the cart's currency for the given coupon
 * against the given subtotal. Percentage discounts are capped at 100%; fixed
 * discounts are capped at the subtotal so the total never goes negative.
 */
function computeDiscount(coupon: CouponPayload, subtotal: number): number {
  if (coupon.discountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, coupon.discountValue));
    return Math.round(subtotal * pct) / 100;
  }
  return Math.min(subtotal, Math.max(0, coupon.discountValue));
}

export function CouponField() {
  const dispatch = useAppDispatch();
  const toast    = useToast();
  const { subtotal } = useCart();
  const applied = useAppSelector((s) => s.checkout.coupon);
  const { items: coupons, loading } = useUiContentSlot<CouponPayload>('coupon', { activeOnly: true });
  const [draft, setDraft] = useState('');

  const onApply = () => {
    const code = draft.trim().toUpperCase();
    if (!code) return;
    const match = coupons.find((c) => (c.code ?? '').toUpperCase() === code);
    if (!match) {
      toast.push({
        variant: 'error',
        title:   'Coupon not recognised',
        message: `"${code}" isn't valid or has expired.`,
      });
      return;
    }
    const amount = computeDiscount(match as CouponPayload, subtotal);
    if (amount <= 0) {
      toast.push({
        variant: 'warning',
        title:   'No discount applied',
        message: 'This coupon resolves to zero off — check the configuration.',
      });
      return;
    }
    dispatch(applyCoupon({
      code:          match.code,
      discountType:  match.discountType,
      discountValue: match.discountValue,
      amount,
    }));
    toast.push({
      variant: 'success',
      title:   'Coupon applied',
      message: `${formatPrice(amount)} off — code ${match.code}.`,
    });
    setDraft('');
  };

  const onRemove = () => {
    dispatch(removeCoupon());
    toast.push({ variant: 'info', message: 'Coupon removed.' });
  };

  return (
    <div className="bg-surface rounded-2xl border border-stroke p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-primary text-sm uppercase tracking-wider">Coupon / Gift card</h2>
        {applied && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted hover:text-danger uppercase tracking-wider font-bold"
          >
            Remove
          </button>
        )}
      </div>

      {applied ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-ok/10 border border-ok/30 text-sm">
          <div>
            <p className="font-mono font-bold text-ok">{applied.code}</p>
            <p className="text-xs text-secondary mt-0.5">
              {applied.discountType === 'percentage'
                ? `${applied.discountValue}% off`
                : `${formatPrice(applied.discountValue)} off`}
              {' — '}
              <span className="text-ok font-semibold">{formatPrice(applied.amount)}</span>{' '}
              applied to this order
            </p>
          </div>
          <svg className="w-5 h-5 text-ok shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onApply(); } }}
            placeholder="ENTER CODE"
            className="flex-1 px-3 py-2.5 rounded-xl bg-surface-raised border border-stroke text-primary font-mono tracking-wider uppercase outline-none focus:border-accent placeholder:text-muted/50"
          />
          <button
            type="button"
            onClick={onApply}
            disabled={!draft.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-wider hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
