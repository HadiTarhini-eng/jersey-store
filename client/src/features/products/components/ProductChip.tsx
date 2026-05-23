import type { Product } from '../../../types';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export type ProductChipKind = 'new' | 'sale' | 'sold-out';

/**
 * Derives the right chip — if any — for a product from its data:
 *  - SOLD OUT  → variants all at 0 stock, or `inStock === false`
 *  - SALE      → `originalPrice` is set and higher than `basePrice`,
 *                 or a "sale" tag is present
 *  - NEW       → `createdAt` is within the last 14 days
 *
 * Returns `null` when none apply (no chip shown).
 * Priority: sold-out > sale > new (only one chip ever wins).
 */
export function pickProductChip(product: Product): ProductChipKind | null {
  // SOLD OUT
  const explicitlyOut = product.inStock === false;
  const allVariantsZero =
    !!product.variants && product.variants.length > 0 &&
    product.variants.every((v) => (v.stockQuantity ?? 0) <= 0);
  if (explicitlyOut || allVariantsZero) return 'sold-out';

  // SALE
  const hasDiscount = typeof product.originalPrice === 'number' && product.originalPrice > product.basePrice;
  const hasSaleTag  = product.tags?.some((t) => t.toLowerCase() === 'sale');
  if (hasDiscount || hasSaleTag) return 'sale';

  // NEW
  if (product.createdAt) {
    const age = Date.now() - new Date(product.createdAt).getTime();
    if (Number.isFinite(age) && age >= 0 && age < FOURTEEN_DAYS_MS) return 'new';
  }

  return null;
}

interface ChipStyle {
  label: string;
  className: string;
}

const styles: Record<ProductChipKind, ChipStyle> = {
  new: {
    label: 'New',
    className: 'bg-accent text-white shadow-lg shadow-accent/30',
  },
  sale: {
    label: 'Sale',
    className: 'bg-power text-white shadow-lg shadow-power/30',
  },
  'sold-out': {
    label: 'Sold Out',
    className: 'bg-danger text-white shadow-lg shadow-danger/30',
  },
};

interface ProductChipProps {
  product:  Product;
  /** Force a specific chip instead of deriving from the product. */
  override?: ProductChipKind;
  className?: string;
}

/**
 * Small pill, always positioned top-right by callers (absolute parent).
 * Returns `null` when there's no chip to show, so callers can safely
 * render it unconditionally.
 */
export function ProductChip({ product, override, className = '' }: ProductChipProps) {
  const kind = override ?? pickProductChip(product);
  if (!kind) return null;
  const s = styles[kind];

  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-1 rounded-full',
        'text-[10px] font-bold uppercase tracking-widest',
        s.className,
        className,
      ].join(' ')}
    >
      {s.label}
    </span>
  );
}
