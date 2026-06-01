import { useMemo, useState } from 'react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { discountService, type DiscountType, computeDiscountedPrice } from '../services/discountService';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { formatPrice } from '../../utils/formatters';
import { extractErrorMessage } from '../../services/api/client';

/**
 * Bulk-discount workbench. Pick products (by filter and/or individual
 * selection), then either apply a percentage / fixed discount or clear an
 * existing discount across the selection.
 */
export function AdminDiscounts() {
  const { items, categories, loading, refresh } = useAdminProducts();
  const { push, promise } = useToast();

  // ── Filter state ─────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [categoryId, setCategoryId]     = useState<string>('all');
  const [onlyOnSale, setOnlyOnSale]     = useState(false);
  const [selected, setSelected]         = useState<Set<string>>(new Set());

  // ── Apply-modal state ────────────────────────────────────────────────────
  const [applyOpen, setApplyOpen]       = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
      if (onlyOnSale && !(typeof p.originalPrice === 'number' && p.originalPrice > p.price)) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.slug.toLowerCase().includes(q) &&
        !(p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      ) return false;
      return true;
    });
  }, [items, categoryId, onlyOnSale, search]);

  const visibleIds  = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);
  const visibleAllSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const selectedRows = useMemo(() => items.filter((p) => selected.has(p.id)), [items, selected]);

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (visibleAllSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectAllFiltered = () => setSelected(new Set(filtered.map((p) => p.id)));

  // ── Apply discount ───────────────────────────────────────────────────────
  const numericValue = Number(discountValue);
  const validValue   = Number.isFinite(numericValue) && numericValue > 0
    && (discountType === 'fixed' || numericValue <= 100);

  const previewSample = selectedRows[0]
    ? computeDiscountedPrice(selectedRows[0], discountType, validValue ? numericValue : 0)
    : null;

  const handleApply = async () => {
    if (!validValue || selectedRows.length === 0) return;
    setSubmitting(true);
    try {
      const result = await promise(
        discountService.applyToMany(selectedRows, discountType, numericValue),
        {
          success: `Discount applied to ${selectedRows.length} product${selectedRows.length === 1 ? '' : 's'}`,
          error:   (err) => extractErrorMessage(err, 'Could not apply discount'),
        },
      );
      if (result.failed.length > 0) {
        push({
          variant: 'warning',
          title:   `${result.failed.length} product${result.failed.length === 1 ? '' : 's'} skipped`,
          message: 'Some updates failed — see the console for details.',
        });
        console.warn('Discount failures', result.failed);
      }
      setApplyOpen(false);
      setDiscountValue('');
      clearSelection();
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (selectedRows.length === 0) return;
    setSubmitting(true);
    try {
      await promise(
        discountService.clearForMany(selectedRows),
        {
          success: `Discount cleared on ${selectedRows.length} product${selectedRows.length === 1 ? '' : 's'}`,
          error:   (err) => extractErrorMessage(err, 'Could not clear discount'),
        },
      );
      clearSelection();
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-sport text-3xl tracking-wide text-primary uppercase">Discounts &amp; Sales</h1>
        <p className="text-sm text-secondary mt-1">
          Pick products by filter or selection, then apply a percentage or fixed-amount discount across them all at once.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-surface rounded-2xl border border-stroke p-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, slug or tag…"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-surface-raised border border-stroke text-primary text-sm outline-none focus:border-accent placeholder:text-muted"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-raised border border-stroke text-primary text-sm outline-none focus:border-accent"
        >
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-stroke text-sm cursor-pointer hover:border-accent/40 transition-colors">
          <input
            type="checkbox"
            checked={onlyOnSale}
            onChange={(e) => setOnlyOnSale(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-primary font-semibold">On sale only</span>
        </label>
        <span className="ml-auto text-xs text-muted uppercase tracking-widest">{filtered.length} matching</span>
      </div>

      {/* Action bar — visible when there's a selection */}
      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 bg-black border border-white/15 rounded-2xl px-4 py-3 shadow-lg shadow-black/40">
        <span className="text-sm text-primary font-bold">
          {selected.size === 0 ? 'No products selected' : `${selected.size} selected`}
        </span>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={selectAllFiltered}
            className="text-xs text-accent hover:text-accent-light uppercase tracking-wider font-bold"
          >
            Select all {filtered.length}
          </button>
        )}
        {selected.size > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-muted hover:text-primary uppercase tracking-wider font-bold"
          >
            Clear selection
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={selected.size === 0 || submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 border-stroke text-secondary hover:border-danger hover:text-danger transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear discount
          </button>
          <button
            type="button"
            onClick={() => setApplyOpen(true)}
            disabled={selected.size === 0 || submitting}
            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply discount
          </button>
        </div>
      </div>

      {/* Product list */}
      <div className="bg-surface rounded-2xl border border-stroke overflow-hidden">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-stroke text-[10px] font-bold uppercase tracking-widest text-muted">
          <input
            type="checkbox"
            checked={visibleAllSelected}
            onChange={toggleAllVisible}
            aria-label="Select all visible"
            className="w-4 h-4"
          />
          <span>Product</span>
          <span>Price</span>
          <span>Original</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted text-sm">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">No products match these filters.</div>
        ) : (
          <div className="divide-y divide-stroke">
            {filtered.map((p) => {
              const onSale = typeof p.originalPrice === 'number' && p.originalPrice > p.price;
              const isSelected = selected.has(p.id);
              return (
                <div
                  key={p.id}
                  className={[
                    'grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] gap-3 items-center px-4 py-3 cursor-pointer hover:bg-surface-raised/50 transition-colors',
                    isSelected && 'bg-accent/5',
                  ].filter(Boolean).join(' ')}
                  onClick={() => toggleOne(p.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    {p.images[0] && (
                      <img src={p.images[0]} alt="" className="w-10 h-12 object-cover rounded-md bg-surface-raised" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-primary font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted truncate">{categories.find((c) => c.id === p.categoryId)?.name ?? '—'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums">{formatPrice(p.price, p.currency)}</span>
                  <span className="text-xs text-muted line-through tabular-nums">
                    {p.originalPrice ? formatPrice(p.originalPrice, p.currency) : '—'}
                  </span>
                  <span>
                    {onSale ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-power/20 text-power border border-power/40">
                        Sale
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply discount modal */}
      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply discount to ${selectedRows.length} product${selectedRows.length === 1 ? '' : 's'}`} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className={['relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-colors',
              discountType === 'percentage' ? 'border-accent bg-accent/10' : 'border-stroke hover:border-accent/40'].join(' ')}>
              <input
                type="radio"
                checked={discountType === 'percentage'}
                onChange={() => setDiscountType('percentage')}
                className="sr-only"
              />
              <span className="text-2xl font-bold text-primary">%</span>
              <span className="text-[10px] uppercase tracking-widest text-muted">Percentage</span>
            </label>
            <label className={['relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-colors',
              discountType === 'fixed' ? 'border-accent bg-accent/10' : 'border-stroke hover:border-accent/40'].join(' ')}>
              <input
                type="radio"
                checked={discountType === 'fixed'}
                onChange={() => setDiscountType('fixed')}
                className="sr-only"
              />
              <span className="text-2xl font-bold text-primary">$</span>
              <span className="text-[10px] uppercase tracking-widest text-muted">Fixed amount</span>
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-widest text-muted mb-1">
              {discountType === 'percentage' ? 'Percent off' : 'Amount off'}
            </span>
            <input
              type="number"
              autoFocus
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min="0"
              max={discountType === 'percentage' ? 100 : undefined}
              step={discountType === 'percentage' ? '1' : '0.01'}
              placeholder={discountType === 'percentage' ? '25' : '15.00'}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-stroke text-primary outline-none focus:border-accent text-lg font-bold"
            />
          </label>

          {previewSample && validValue && (
            <div className="p-3 rounded-xl border border-stroke bg-surface-raised/40 text-xs">
              <p className="text-muted uppercase tracking-widest mb-1">Preview ({selectedRows[0].name})</p>
              <p>
                <span className="text-muted line-through">{formatPrice(selectedRows[0].price)}</span>
                <span className="mx-2">→</span>
                <span className="text-primary font-bold text-base">{formatPrice(previewSample.newPrice)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke">
          <button
            type="button"
            onClick={() => setApplyOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-muted hover:text-primary hover:bg-surface-raised transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!validValue || submitting}
            className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-wider hover:bg-accent-light shadow-lg shadow-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </Modal>
    </div>
  );
}
