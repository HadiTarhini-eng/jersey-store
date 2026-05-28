import { http } from './client';
import { endpoints } from './endpoints';
import type { ResolvedCouponResponse } from '../../types';

export const couponApi = {
  /**
   * Resolve a coupon code against the server-side subtotal. Throws (404) when
   * the code is missing/inactive; resolves to a canonical `{ code, ..., amount }`
   * when the code is valid. The `amount` field is already capped at the subtotal.
   */
  validate: (code: string, subtotal: number) =>
    http.post<ResolvedCouponResponse>(endpoints.coupons.validate(), { code, subtotal }),
};
