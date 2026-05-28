import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const ValidateCouponBody = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 80 }),
  subtotal: Type.Number({ minimum: 0 }),
})
export type ValidateCouponBodyType = Static<typeof ValidateCouponBody>

export const validateCouponSchema: FastifySchema = {
  tags: ['Coupons'],
  body: ValidateCouponBody,
  description: 'Resolve a coupon code against the server-side subtotal. Returns the canonical discount amount or 404 if the code is missing/inactive.',
}
