import type { RouteOptions } from 'fastify'
import type { IReviewService } from '../../../../core/services/commerce.svc.js'
import * as ctrl from '../../controllers/review.ctrl.js'
import * as s from '../../schemas/review.schemas.js'

export const reviewRoutes = (service: IReviewService): RouteOptions[] => [
  { method: 'POST',   url: '/reviews',                          roles: ['User', 'Admin'], schema: s.createReviewSchema,       handler: ctrl.createReview(service) },
  { method: 'GET',    url: '/reviews/:id',                      protected: false,         schema: s.getReviewSchema,          handler: ctrl.getReviewById(service) },
  { method: 'GET',    url: '/products/:productId/reviews',      protected: false,         schema: s.listProductReviewsSchema, handler: ctrl.listProductReviews(service) },
  { method: 'GET',    url: '/users/:userId/reviews',            roles: ['User', 'Admin'], schema: s.listUserReviewsSchema,    handler: ctrl.listUserReviews(service) },
  { method: 'PATCH',  url: '/reviews/:id',                      roles: ['User', 'Admin'], schema: s.updateReviewSchema,       handler: ctrl.updateReview(service) },
  { method: 'POST',   url: '/reviews/:id/verify-purchase',      roles: ['Admin'],         schema: s.verifyPurchaseSchema,     handler: ctrl.markVerifiedPurchase(service) },
  { method: 'DELETE', url: '/reviews/:id',                      roles: ['User', 'Admin'], schema: s.deleteReviewSchema,       handler: ctrl.deactivateReview(service) },
]
