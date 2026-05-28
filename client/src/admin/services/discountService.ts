import { productApi } from '../../services/api';
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
 * is captured as the new compare-at so the storefront's struck-through MSRP
 * reflects the true original. Re-applying a discount later won't overwrite
 * that captured value (it stays the original MSRP, not the already-discounted
 * price).
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

export const discountService = {
  /**
   * Apply a discount to many products in a single transactional request via
   * POST /products/bulk-pricing. The whole batch succeeds or fails together —
   * no partial-success book-keeping required.
   */
  async applyToMany(rows: AdminProductRow[], type: DiscountType, value: number): Promise<{ ok: number; failed: Array<{ row: AdminProductRow; error: unknown }> }> {
    if (rows.length === 0) return { ok: 0, failed: [] };
    const items = rows.map((row) => {
      const { newPrice, newOriginal } = computeDiscountedPrice(row, type, value);
      return { productId: row.id, basePrice: newPrice, compareAtPrice: newOriginal };
    });
    try {
      await productApi.bulkPricing(items);
      return { ok: rows.length, failed: [] };
    } catch (error) {
      return { ok: 0, failed: rows.map((row) => ({ row, error })) };
    }
  },

  /**
   * Clear discounts: restores `basePrice` to each row's captured `originalPrice`
   * and explicitly nulls `compareAtPrice`. No-op for rows that aren't on sale.
   */
  async clearForMany(rows: AdminProductRow[]): Promise<{ ok: number; failed: Array<{ row: AdminProductRow; error: unknown }> }> {
    const onSale = rows.filter((r) => typeof r.originalPrice === 'number' && r.originalPrice > r.price);
    if (onSale.length === 0) return { ok: 0, failed: [] };
    const items = onSale.map((row) => ({
      productId:      row.id,
      basePrice:      row.originalPrice!,
      compareAtPrice: null,
    }));
    try {
      await productApi.bulkPricing(items);
      return { ok: onSale.length, failed: [] };
    } catch (error) {
      return { ok: 0, failed: onSale.map((row) => ({ row, error })) };
    }
  },
};
