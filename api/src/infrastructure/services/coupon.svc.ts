import { and, eq, sql } from 'drizzle-orm'
import {
  type CouponDiscountType,
  type CouponPayload,
  type ICouponService,
  type ResolvedCoupon,
} from '../../core/services/coupon.svc.js'
import { type UiContent } from '../../core/entities/ui-content.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { orders } from '../database/schema.js'
import { NotFoundError, ValidationError } from './errors.js'

const COUPON_DISCOUNT_TYPES: readonly CouponDiscountType[] = ['percentage', 'fixed', 'free_shipping']

function roundCents(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Type-guards a ui_content payload as a CouponPayload. Coupon rows live in the
 * generic ui_content table under the `coupon` slot, so each lookup re-validates
 * the shape before trusting it.
 */
export function isCouponPayload(payload: unknown): payload is CouponPayload {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  if (typeof p.code !== 'string' || p.code.trim().length === 0) return false
  if (typeof p.discountType !== 'string' || !COUPON_DISCOUNT_TYPES.includes(p.discountType as CouponDiscountType)) return false
  if (typeof p.discountValue !== 'number' || !Number.isFinite(p.discountValue) || p.discountValue < 0) return false
  // itemsAllowedPerUser is optional; if present must be a positive integer or null.
  if (p.itemsAllowedPerUser !== undefined && p.itemsAllowedPerUser !== null) {
    if (typeof p.itemsAllowedPerUser !== 'number' || !Number.isFinite(p.itemsAllowedPerUser) || p.itemsAllowedPerUser < 1) return false
  }
  // ordersAllowedPerUser is optional (free-shipping per-order cap); same rules.
  if (p.ordersAllowedPerUser !== undefined && p.ordersAllowedPerUser !== null) {
    if (typeof p.ordersAllowedPerUser !== 'number' || !Number.isFinite(p.ordersAllowedPerUser) || p.ordersAllowedPerUser < 1) return false
  }
  // allowedUserIds is optional; if present must be an array of non-empty strings.
  if (p.allowedUserIds !== undefined && p.allowedUserIds !== null) {
    if (!Array.isArray(p.allowedUserIds)) return false
    if (!p.allowedUserIds.every((u) => typeof u === 'string' && u.trim().length > 0)) return false
  }
  return true
}

/**
 * Pro-rated per-item discount. The coupon's nominal discount (full subtotal
 * basis) is scaled by itemsApplied / totalItems so that applying to fewer
 * items yields a proportionally smaller discount. Both branches are bounded
 * at the (scaled) subtotal so the amount never exceeds what the customer
 * actually owes for those items.
 */
export function computeCouponAmount(
  payload: CouponPayload,
  subtotal: number,
  itemsApplied: number,
  totalItems: number,
): number {
  if (subtotal <= 0 || totalItems <= 0 || itemsApplied <= 0) return 0
  const ratio = Math.min(1, Math.max(0, itemsApplied / totalItems))
  const eligibleSubtotal = subtotal * ratio
  if (payload.discountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, payload.discountValue))
    return roundCents((eligibleSubtotal * pct) / 100)
  }
  // Fixed-amount coupons treat `discountValue` as a per-item amount and cap
  // at the eligible subtotal so the customer can't be paid to take items.
  const fixedTotal = Math.max(0, payload.discountValue) * itemsApplied
  return roundCents(Math.min(eligibleSubtotal, fixedTotal))
}

export class CouponService implements ICouponService {
  constructor(
    /** Repository over the generic ui_content table — coupons live in slot='coupon'. */
    private readonly uiContentRepository: EntityRepository<UiContent>,
  ) {}

  /**
   * Look up the coupon row + payload by code. Internal helper — both resolve()
   * and validate() use it. Returns the payload so the per-user-cap check can
   * read `itemsAllowedPerUser` from it.
   */
  private async findActivePayload(code: string): Promise<CouponPayload | null> {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return null
    const rows = await this.uiContentRepository.listBy('slot', 'coupon')
    for (const row of rows) {
      if (!row.isActive) continue
      if (!isCouponPayload(row.payload)) continue
      const payload = row.payload as CouponPayload
      if (payload.code.trim().toUpperCase() === trimmed) return payload
    }
    return null
  }

  async resolve(code: string, subtotal: number, itemCount: number, totalItems: number): Promise<ResolvedCoupon | null> {
    if (!code || typeof code !== 'string') return null
    if (!Number.isFinite(subtotal) || subtotal < 0) return null
    if (!Number.isInteger(itemCount) || itemCount < 1) return null
    if (!Number.isInteger(totalItems) || totalItems < itemCount) return null
    const payload = await this.findActivePayload(code)
    if (!payload) return null
    const freeShipping = payload.discountType === 'free_shipping'
    const amount = freeShipping ? 0 : computeCouponAmount(payload, subtotal, itemCount, totalItems)
    return {
      code: payload.code,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      amount,
      itemsApplied: freeShipping ? 0 : itemCount,
      totalItems,
      itemsAllowedPerUser: freeShipping ? null : (payload.itemsAllowedPerUser ?? null),
      itemsAlreadyUsed: 0,
      itemsRemainingAfter: !freeShipping && payload.itemsAllowedPerUser != null
        ? Math.max(0, payload.itemsAllowedPerUser - itemCount)
        : null,
      freeShipping,
      ordersAllowedPerUser: freeShipping ? (payload.ordersAllowedPerUser ?? null) : null,
      ordersRemainingAfter: freeShipping && payload.ordersAllowedPerUser != null
        ? Math.max(0, payload.ordersAllowedPerUser - 1)
        : null,
    }
  }

  async validate(
    code: string,
    subtotal: number,
    itemCount: number,
    totalItems: number,
    userId?: string | null,
  ): Promise<ResolvedCoupon> {
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new ValidationError('subtotal cannot be negative')
    }
    if (!Number.isInteger(itemCount) || itemCount < 1) {
      throw new ValidationError('itemCount must be a positive integer')
    }
    if (!Number.isInteger(totalItems) || totalItems < 1) {
      throw new ValidationError('totalItems must be a positive integer')
    }
    if (itemCount > totalItems) {
      throw new ValidationError(`Cannot apply coupon to ${itemCount} items — cart only has ${totalItems}`)
    }
    const payload = await this.findActivePayload(code)
    if (!payload) throw new NotFoundError('Coupon')

    // Coupons require a signed-in account — guests can never redeem. This is a
    // global policy (not just for allowlisted coupons) so identity-based rules
    // below have something to match against.
    if (!userId) {
      throw new ValidationError('Sign in to use a coupon — coupons are only available to registered customers.')
    }

    // Per-customer allowlist. When the coupon names specific customers, only
    // those accounts may redeem it; every other signed-in user is rejected.
    if (payload.allowedUserIds && payload.allowedUserIds.length > 0) {
      if (!payload.allowedUserIds.includes(userId)) {
        throw new ValidationError(`Coupon ${payload.code} isn't available for your account.`)
      }
    }

    // ── Free-delivery coupons ───────────────────────────────────────────────
    // These waive the shipping fee (computed by the order service) rather than
    // discounting the subtotal, and are capped per *order* (not per item).
    if (payload.discountType === 'free_shipping') {
      let ordersAlreadyUsed = 0
      if (payload.ordersAllowedPerUser) {
        ordersAlreadyUsed = await this.countOrdersUsedByUser(payload.code, userId)
        if (ordersAlreadyUsed >= payload.ordersAllowedPerUser) {
          throw new ValidationError(`You've already used ${payload.code} on ${payload.ordersAllowedPerUser} order${payload.ordersAllowedPerUser === 1 ? '' : 's'}.`)
        }
      }
      return {
        code: payload.code,
        discountType: 'free_shipping',
        discountValue: 0,
        amount: 0,                 // shipping waiver applied by the order service
        itemsApplied: 0,
        totalItems,
        itemsAllowedPerUser: null,
        itemsAlreadyUsed: 0,
        itemsRemainingAfter: null,
        freeShipping: true,
        ordersAllowedPerUser: payload.ordersAllowedPerUser ?? null,
        ordersRemainingAfter: payload.ordersAllowedPerUser != null
          ? Math.max(0, payload.ordersAllowedPerUser - ordersAlreadyUsed - 1)
          : null,
      }
    }

    // Per-user item cap. Only enforced when:
    //  - the coupon explicitly sets `itemsAllowedPerUser`, AND
    //  - the caller is authenticated (we can identify them by userId).
    // Guests bypass the cap entirely — we have no reliable identity to count
    // against — so for them itemsAlreadyUsed stays 0.
    let itemsAlreadyUsed = 0
    if (payload.itemsAllowedPerUser && userId) {
      itemsAlreadyUsed = await this.countItemsUsedByUser(payload.code, userId)
      const remaining = Math.max(0, payload.itemsAllowedPerUser - itemsAlreadyUsed)
      if (remaining <= 0) {
        throw new ValidationError(`You've used all ${payload.itemsAllowedPerUser} items available on ${payload.code}.`)
      }
      if (itemCount > remaining) {
        throw new ValidationError(
          `Only ${remaining} item${remaining === 1 ? '' : 's'} left on ${payload.code} for this account — try applying it to ${remaining} item${remaining === 1 ? '' : 's'} instead.`,
        )
      }
    }

    const amount = computeCouponAmount(payload, subtotal, itemCount, totalItems)
    if (amount <= 0) throw new ValidationError('Coupon resolves to zero discount')

    const itemsRemainingAfter = payload.itemsAllowedPerUser != null
      ? Math.max(0, payload.itemsAllowedPerUser - itemsAlreadyUsed - itemCount)
      : null

    return {
      code: payload.code,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      amount,
      itemsApplied: itemCount,
      totalItems,
      itemsAllowedPerUser: payload.itemsAllowedPerUser ?? null,
      itemsAlreadyUsed,
      itemsRemainingAfter,
      freeShipping: false,
      ordersAllowedPerUser: null,
      ordersRemainingAfter: null,
    }
  }

  /**
   * Sum up the items this user has previously applied this coupon to.
   * Cancelled orders count too — once a code redemption is recorded, the
   * units are spent. If a shop wants to refund the units on cancel, swap
   * this to exclude `status = 'cancelled'`.
   */
  private async countItemsUsedByUser(code: string, userId: string): Promise<number> {
    const { db } = await import('../database/db.js')
    const rows = await db
      .select({ used: sql<number>`coalesce(sum(${orders.couponItemsApplied}), 0)::int` })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.couponCode, code)))
    return Number(rows[0]?.used ?? 0)
  }

  /**
   * Count how many orders this user has already applied a coupon code to —
   * the per-order cap for free-delivery coupons. Counts every recorded
   * redemption (cancelled orders included), matching the item-cap policy.
   */
  private async countOrdersUsedByUser(code: string, userId: string): Promise<number> {
    const { db } = await import('../database/db.js')
    const rows = await db
      .select({ used: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.couponCode, code)))
    return Number(rows[0]?.used ?? 0)
  }
}
