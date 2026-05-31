import { useEffect, useState } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { useCart } from '../../cart/hooks/useCart';
import { applyCoupon, removeCoupon } from '../checkoutSlice';
import { formatPrice } from '../../../utils/formatters';
import { couponApi, extractErrorMessage, extractErrorStatus } from '../../../services/api';

export function CouponField() {
  const dispatch = useAppDispatch();
  const toast    = useToast();
  const { subtotal, totalItems } = useCart();
  const applied = useAppSelector((s) => s.checkout.coupon);
  const [draft, setDraft] = useState('');
  // How many items the buyer wants the coupon applied to. Defaults to the
  // whole cart so the common case is one-click — they can lower it to bank
  // remaining items on the coupon for a future order.
  const [itemsToApply, setItemsToApply] = useState<number>(Math.max(1, totalItems));
  const [submitting, setSubmitting] = useState(false);

  // Keep the items slider in sync when the cart changes underneath us
  // (someone bumped a quantity in another tab, etc.).
  useEffect(() => {
    setItemsToApply((prev) => Math.min(Math.max(1, prev), Math.max(1, totalItems)));
  }, [totalItems]);

  const onApply = async () => {
    const code = draft.trim().toUpperCase();
    if (!code) return;
    if (totalItems < 1) {
      toast.push({ variant: 'warning', message: 'Add items to your cart before applying a coupon.' });
      return;
    }
    const requested = Math.max(1, Math.min(itemsToApply, totalItems));
    setSubmitting(true);
    try {
      const resolved = await couponApi.validate(code, subtotal, requested, totalItems);
      dispatch(applyCoupon({
        code:                resolved.code,
        discountType:        resolved.discountType,
        discountValue:       resolved.discountValue,
        amount:              resolved.amount,
        itemsApplied:        resolved.itemsApplied,
        totalItems:          resolved.totalItems,
        itemsAllowedPerUser: resolved.itemsAllowedPerUser,
        itemsRemainingAfter: resolved.itemsRemainingAfter,
      }));
      // Two-line toast: confirm the discount, then surface remaining-items so
      // the buyer knows how much of the coupon is left for next time.
      const remainingMsg = resolved.itemsRemainingAfter == null
        ? 'No item limit on this coupon.'
        : resolved.itemsRemainingAfter === 0
          ? "You've used up this coupon — no items left for future orders."
          : `${resolved.itemsRemainingAfter} item${resolved.itemsRemainingAfter === 1 ? '' : 's'} left on this coupon for future orders.`;
      toast.push({
        variant: 'success',
        title:   'Coupon applied',
        message: `${formatPrice(resolved.amount)} off — applied to ${resolved.itemsApplied} of ${resolved.totalItems} item${resolved.totalItems === 1 ? '' : 's'}. ${remainingMsg}`,
      });
      setDraft('');
    } catch (err) {
      // 404 → unknown code; 400 → zero discount / cap exhausted; else bubble.
      const status  = extractErrorStatus(err);
      const message = extractErrorMessage(err, 'Could not apply coupon.');
      if (status === 404) {
        toast.push({ variant: 'error', title: 'Coupon not recognised', message: `"${code}" isn't valid or has expired.` });
      } else if (status === 400) {
        toast.push({ variant: 'warning', title: 'Coupon unavailable', message });
      } else {
        toast.push({ variant: 'error', title: 'Coupon error', message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = () => {
    dispatch(removeCoupon());
    toast.push({ variant: 'info', message: 'Coupon removed.' });
  };

  const itemsClamp = Math.max(1, totalItems);

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
                : `${formatPrice(applied.discountValue)} off per item`}
              {' — '}
              <span className="text-ok font-semibold">{formatPrice(applied.amount)}</span>{' '}
              on {applied.itemsApplied} of {applied.totalItems} item{applied.totalItems === 1 ? '' : 's'}
            </p>
            {applied.itemsRemainingAfter != null && (
              <p className="text-[11px] text-muted mt-0.5">
                {applied.itemsRemainingAfter === 0
                  ? 'No items left on this coupon for future orders.'
                  : `${applied.itemsRemainingAfter} item${applied.itemsRemainingAfter === 1 ? '' : 's'} left on this coupon for future orders.`}
              </p>
            )}
          </div>
          <svg className="w-5 h-5 text-ok shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="space-y-2">
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
              disabled={!draft.trim() || submitting || totalItems < 1}
              className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-wider hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
          <label className="flex items-center justify-between gap-3 text-xs">
            <span className="text-secondary uppercase tracking-wider font-bold">
              Apply to
            </span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={itemsClamp}
                step={1}
                value={Math.min(itemsToApply, itemsClamp)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setItemsToApply(Math.max(1, Math.min(Math.floor(n), itemsClamp)));
                }}
                className="w-16 px-2 py-1.5 rounded-lg bg-surface-raised border border-stroke text-primary text-center outline-none focus:border-accent"
              />
              <span className="text-muted">of {totalItems} item{totalItems === 1 ? '' : 's'}</span>
            </span>
          </label>
          <p className="text-[11px] text-muted">
            Lower this if you want to save remaining items on a per-user-capped coupon for a future order.
          </p>
        </div>
      )}
    </div>
  );
}
