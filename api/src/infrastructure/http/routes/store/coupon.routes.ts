import type { RouteOptions } from 'fastify'
import type { ICouponService } from '../../../../core/services/coupon.svc.js'
import * as ctrl from '../../controllers/coupon.ctrl.js'
import * as s from '../../schemas/coupon.schemas.js'

export const couponRoutes = (service: ICouponService): RouteOptions[] => [
  { method: 'POST', url: '/coupons/validate', protected: false, schema: s.validateCouponSchema, handler: ctrl.validateCoupon(service) },
]
