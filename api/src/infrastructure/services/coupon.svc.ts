import {
  type CouponDiscountType,
  type CouponPayload,
  type ICouponService,
  type ResolvedCoupon,
} from '../../core/services/coupon.svc.js'
import { type UiContent } from '../../core/entities/ui-content.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
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

  async resolve(code: string, subtotal: number): Promise<ResolvedCoupon | null> {
    if (!code || typeof code !== 'string') return null
    if (!Number.isFinite(subtotal) || subtotal < 0) return null
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return null

    const rows = await this.uiContentRepository.listBy('slot', 'coupon')
    for (const row of rows) {
      if (!row.isActive) continue
      if (!isCouponPayload(row.payload)) continue
      const payload = row.payload as CouponPayload
      if (payload.code.trim().toUpperCase() !== trimmed) continue
      const amount = computeCouponAmount(payload, subtotal)
      return {
        code: payload.code,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        amount,
      }
    }
    return null
  }

  async validate(code: string, subtotal: number): Promise<ResolvedCoupon> {
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new ValidationError('subtotal cannot be negative')
    }
    const resolved = await this.resolve(code, subtotal)
    if (!resolved) throw new NotFoundError('Coupon')
    if (resolved.amount <= 0) throw new ValidationError('Coupon resolves to zero discount')
    return resolved
  }
}
