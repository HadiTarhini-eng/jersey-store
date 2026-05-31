export type CouponDiscountType = 'percentage' | 'fixed'

export interface CouponPayload {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  description?: string
  /**
   * Max times any single authenticated user can redeem this coupon. `null`
   * or `undefined` = no per-user cap. Guest checkouts are excluded from the
   * count (we can't tie them to an account); shops that want to gate guests
   * should disable the coupon or require account creation.
   */
  usageLimitPerUser?: number | null
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
   * against the server-side subtotal. When `userId` is supplied, also enforces
   * the coupon's `usageLimitPerUser` cap by counting prior orders the user
   * placed with this code. Throws NotFoundError when the code is missing /
   * inactive; ValidationError when the resolved amount is zero OR when the
   * per-user limit has been reached.
   */
  validate: (code: string, subtotal: number, userId?: string | null) => Promise<ResolvedCoupon>
  /** Same lookup, without throwing the limit check — used internally by the order service after auth has been resolved. */
  resolve: (code: string, subtotal: number) => Promise<ResolvedCoupon | null>
}
