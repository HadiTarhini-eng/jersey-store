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

const COUPON_DISCOUNT_TYPES: readonly CouponDiscountType[] = ['percentage', 'fixed']

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
  // usageLimitPerUser is optional; if present it must be a positive number or null.
  if (p.usageLimitPerUser !== undefined && p.usageLimitPerUser !== null) {
    if (typeof p.usageLimitPerUser !== 'number' || !Number.isFinite(p.usageLimitPerUser) || p.usageLimitPerUser < 1) return false
  }
  return true
}

export function computeCouponAmount(payload: CouponPayload, subtotal: number): number {
  if (subtotal <= 0) return 0
  if (payload.discountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, payload.discountValue))
    return roundCents((subtotal * pct) / 100)
  }
  return roundCents(Math.min(subtotal, Math.max(0, payload.discountValue)))
}

export class CouponService implements ICouponService {
  constructor(
    /** Repository over the generic ui_content table — coupons live in slot='coupon'. */
    private readonly uiContentRepository: EntityRepository<UiContent>,
  ) {}

  /**
   * Look up the coupon row + payload by code. Internal helper — both resolve()
   * and validate() use it. Returns the row so the per-user-limit check can
   * read `usageLimitPerUser` from the payload.
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

  async resolve(code: string, subtotal: number): Promise<ResolvedCoupon | null> {
    if (!code || typeof code !== 'string') return null
    if (!Number.isFinite(subtotal) || subtotal < 0) return null
    const payload = await this.findActivePayload(code)
    if (!payload) return null
    const amount = computeCouponAmount(payload, subtotal)
    return {
      code: payload.code,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      amount,
    }
  }

  async validate(code: string, subtotal: number, userId?: string | null): Promise<ResolvedCoupon> {
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new ValidationError('subtotal cannot be negative')
    }
    const payload = await this.findActivePayload(code)
    if (!payload) throw new NotFoundError('Coupon')

    const amount = computeCouponAmount(payload, subtotal)
    if (amount <= 0) throw new ValidationError('Coupon resolves to zero discount')

    // Per-user redemption cap. Only enforced when:
    //  - the coupon explicitly sets `usageLimitPerUser`, AND
    //  - the caller is authenticated (we can identify them by userId).
    // Guests bypass the cap because we have no reliable identity to count
    // against — shops that want to gate guests should disable the coupon.
    if (payload.usageLimitPerUser && userId) {
      const used = await this.countRedemptionsForUser(payload.code, userId)
      if (used >= payload.usageLimitPerUser) {
        throw new ValidationError(`Coupon ${payload.code} has already been used the maximum number of times by this account`)
      }
    }

    return {
      code: payload.code,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      amount,
    }
  }

  /**
   * Count this user's orders that successfully redeemed the given coupon.
   * Both cancelled and successful orders count toward the limit — once a code
   * is used at submit time, that redemption sticks. If a shop wants to allow
   * re-use after cancel, swap this to exclude `status = 'cancelled'`.
   */
  private async countRedemptionsForUser(code: string, userId: string): Promise<number> {
    const { db } = await import('../database/db.js')
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.couponCode, code)))
    return Number(rows[0]?.count ?? 0)
  }
}
