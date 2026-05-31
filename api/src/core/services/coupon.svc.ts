export type CouponDiscountType = 'percentage' | 'fixed'

export interface CouponPayload {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  description?: string
  /**
   * Cap on how many *items* (units, not orders) any single signed-in user can
   * redeem this coupon against across all their orders. `null` or omitted ⇒
   * no cap. Guest checkouts bypass the cap because we have no identity to
   * count against — shops that want to gate guests should disable the coupon
   * or require account creation.
   *
   * Example: cap = 7. User A places an order applying the coupon to 5 items;
   * 2 items remain on the coupon for User A's future orders. User B's tally
   * is independent.
   */
  itemsAllowedPerUser?: number | null
  /**
   * Optional allowlist of user ids permitted to redeem this coupon. When
   * omitted/empty, any signed-in customer may use it. When non-empty, only
   * those accounts can — every other signed-in user is rejected. Coupons
   * always require sign-in (guests can never redeem), so this further narrows
   * an already-authenticated audience to a hand-picked set of customers.
   */
  allowedUserIds?: string[] | null
}

export interface ResolvedCoupon {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  /** Resolved discount amount in cart currency, already pro-rated to itemsApplied / totalItems and capped at the subtotal. */
  amount: number
  /** How many items the coupon would apply to in this validation (always 0..totalItems and 0..itemsRemainingBefore). */
  itemsApplied: number
  /** Total items in the cart at validation time. Echoed back so the UI can show "applied to X of Y items". */
  totalItems: number
  /** Per-user cap from the coupon definition, or null when uncapped. */
  itemsAllowedPerUser: number | null
  /** Items the user has already redeemed on prior orders (0 for guests). */
  itemsAlreadyUsed: number
  /** Items left on the coupon for this user *after* this application would settle. `null` when uncapped. */
  itemsRemainingAfter: number | null
}

export interface ICouponService {
  /**
   * Resolve a coupon against the server-side cart, recompute the per-item
   * pro-rated discount, and enforce the per-user item cap. Returns the
   * canonical `ResolvedCoupon` (used by the checkout UI to show the toast
   * and by the order service to verify totals at submit time).
   *
   * - `itemCount` is how many items the buyer wants this coupon applied to.
   *   Must be ≥ 1 and ≤ `totalItems`. Must also fit within the user's
   *   remaining cap (when signed in and the coupon is capped).
   * - `totalItems` is the total number of units in the cart.
   * - `userId` is optional — when present, the per-user cap is enforced
   *   against the user's prior orders.
   *
   * Throws NotFoundError when the code is unknown/inactive; ValidationError
   * when the discount resolves to 0, when the cap is exhausted, or when
   * the requested `itemCount` exceeds the cap remaining or the cart size.
   */
  validate: (
    code: string,
    subtotal: number,
    itemCount: number,
    totalItems: number,
    userId?: string | null,
  ) => Promise<ResolvedCoupon>
  /** Same lookup without the cap check — used internally by order submission after auth has been resolved. */
  resolve: (
    code: string,
    subtotal: number,
    itemCount: number,
    totalItems: number,
  ) => Promise<ResolvedCoupon | null>
}
