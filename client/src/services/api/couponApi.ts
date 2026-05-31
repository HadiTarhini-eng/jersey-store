import { http } from './client';
import { endpoints } from './endpoints';
import type { ResolvedCouponResponse } from '../../types';

export const couponApi = {
  /**
   * Resolve a coupon code against the server-side subtotal + item count.
   * The server pro-rates the discount by `itemCount / totalItems` and
   * enforces the per-user item cap (when the caller is signed in). 404
   * when the code is missing/inactive; 400 when the cap is exhausted or
   * would be exceeded. The `amount` field is already capped at the
   * eligible subtotal.
   */
  validate: (code: string, subtotal: number, itemCount: number, totalItems: number) =>
    http.post<ResolvedCouponResponse>(endpoints.coupons.validate(), {
      code, subtotal, itemCount, totalItems,
    }),
};
