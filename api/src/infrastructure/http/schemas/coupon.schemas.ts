import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const ValidateCouponBody = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 80 }),
  subtotal: Type.Number({ minimum: 0 }),
  // Number of items the buyer wants the coupon applied to. Drives the
  // pro-rated discount (amount = full * itemCount / totalItems) and the
  // per-user item-cap check.
  itemCount: Type.Integer({ minimum: 1 }),
  // Total units across all line items in the cart. Used both to pro-rate
  // the discount and to bound `itemCount`.
  totalItems: Type.Integer({ minimum: 1 }),
})
export type ValidateCouponBodyType = Static<typeof ValidateCouponBody>

export const validateCouponSchema: FastifySchema = {
  tags: ['Coupons'],
  body: ValidateCouponBody,
  description: 'Resolve a coupon code against the server-side subtotal + item count. Returns the pro-rated discount, items the buyer can apply it to right now, and how many items remain on the per-user cap. 404 when the code is unknown; 400 when the buyer has exhausted (or would exceed) their cap.',
}
