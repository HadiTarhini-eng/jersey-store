import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ICouponService } from '../../../core/services/coupon.svc.js'
import { sendOk } from '../routes/route-utils.js'
import type { ValidateCouponBodyType } from '../schemas/coupon.schemas.js'

export const validateCoupon = (service: ICouponService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { code, subtotal, itemCount, totalItems } = request.body as ValidateCouponBodyType
    // Coupon validation is unprotected so guests can apply codes too. We still
    // try to verify a JWT (swallowing errors) so signed-in customers get their
    // per-user item cap enforced.
    let userId: string | null = null
    try {
      await request.jwtVerify()
      userId = (request.user as { id?: string } | undefined)?.id ?? null
    } catch {
      userId = null
    }
    sendOk(reply, await service.validate(code, subtotal, itemCount, totalItems, userId))
  }
