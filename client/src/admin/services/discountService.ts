import { productApi } from '../../services/api';
import { encodeProductTags } from '../../features/products/lib/productMeta';
import type { AdminProductRow } from './adminProductsApi';

export type DiscountType = 'percentage' | 'fixed';

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute the discounted price for one product, given an existing row.
 * - Percentage: subtracts `value`% of the *current* basePrice.
 * - Fixed:      subtracts a flat amount, floored at zero.
 *
 * If the row doesn't already carry an `originalPrice`, the pre-discount price
 * is captured as the new originalPrice so the storefront's struck-through
 * "compare-at" reflects the true MSRP — re-applying a discount later won't
 * overwrite that captured value (it stays the original MSRP, not the
 * already-discounted price).
 */
export function computeDiscountedPrice(row: AdminProductRow, type: DiscountType, value: number): { newPrice: number; newOriginal: number } {
  const current = row.price;
  const newPrice = type === 'percentage'
    ? Math.max(0, current - (current * value) / 100)
    : Math.max(0, current - value);
  const newOriginal = row.originalPrice && row.originalPrice > newPrice
    ? row.originalPrice
    : current;
  return { newPrice: roundCents(newPrice), newOriginal: roundCents(newOriginal) };
}

/**
 * Patch a single product's price + originalPrice. Rebuilds the full tag
 * array from the row's existing meta so unrelated tags (sport, team, badge,
 * features, printable, …) survive the update.
 */
async function patchPricing(row: AdminProductRow, newPrice: number, newOriginal: number | undefined): Promise<void> {
  const tags = encodeProductTags({
    sport:         row.sport,
    team:          row.team,
    category:      row.category,
    badge:         row.badge,
    currency:      row.currency,
    originalPrice: newOriginal,
    features:      row.features,
    printable:     row.printable,
    tags:          row.tags,
  });
  await productApi.update(row.id, { basePrice: newPrice, tags });
}

export const discountService = {
  /**
   * Apply a discount to many products in parallel. Returns a summary of
   * successes and per-row failures so the caller can surface a useful toast.
   */
  async applyToMany(rows: AdminProductRow[], type: DiscountType, value: number): Promise<{ ok: number; failed: Array<{ row: AdminProductRow; error: unknown }> }> {
    const results = await Promise.allSettled(
      rows.map(async (row) => {
        const { newPrice, newOriginal } = computeDiscountedPrice(row, type, value);
        await patchPricing(row, newPrice, newOriginal);
      }),
    );
    let ok = 0;
    const failed: Array<{ row: AdminProductRow; error: unknown }> = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') ok++;
      else failed.push({ row: rows[i], error: r.reason });
    });
    return { ok, failed };
  },

  /**
   * Clear a discount: restores `basePrice` to the row's `originalPrice` and
   * drops the `originalPrice` tag. No-op for rows that aren't on sale.
   */
  async clearForMany(rows: AdminProductRow[]): Promise<{ ok: number; failed: Array<{ row: AdminProductRow; error: unknown }> }> {
    const onSale = rows.filter((r) => typeof r.originalPrice === 'number' && r.originalPrice > r.price);
    const results = await Promise.allSettled(
      onSale.map((row) => patchPricing(row, row.originalPrice!, undefined)),
    );
    let ok = 0;
    const failed: Array<{ row: AdminProductRow; error: unknown }> = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') ok++;
      else failed.push({ row: onSale[i], error: r.reason });
    });
    return { ok, failed };
  },
};
