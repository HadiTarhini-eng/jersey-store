export type CouponDiscountType = 'percentage' | 'fixed'

export interface CouponPayload {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  description?: string
}

export interface ResolvedCoupon {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  /** Resolved discount amount in the cart currency, computed against the subtotal. Already capped at the subtotal. */
  amount: number
}

export interface ICouponService {
  /**
   * Look up a coupon code in the active set and recompute the discount amount
   * against the server-side subtotal. Throws NotFoundError when the code is
   * missing/inactive; ValidationError when the resolved amount is zero.
   */
  validate: (code: string, subtotal: number) => Promise<ResolvedCoupon>
  /** Same lookup, without throwing — used internally by the order service. */
  resolve: (code: string, subtotal: number) => Promise<ResolvedCoupon | null>
}
