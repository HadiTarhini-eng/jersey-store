import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })
const ProductIdParams = Type.Object({ productId: Type.String() })
const UserIdParams = Type.Object({ userId: Type.String() })

const ReviewBody = Type.Object({
  id: Type.Optional(Type.String()),
  userId: Type.String(),
  productId: Type.String(),
  rating: Type.Integer({ minimum: 1, maximum: 5 }),
  title: Type.Optional(Type.String()),
  comment: Type.Optional(Type.String()),
  isVerifiedPurchase: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
})
export type ReviewBodyType = Static<typeof ReviewBody>

const UpdateReviewBody = Type.Object({
  rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
  title: Type.Optional(Type.String()),
  comment: Type.Optional(Type.String()),
})
export type UpdateReviewBodyType = Static<typeof UpdateReviewBody>

export const createReviewSchema: FastifySchema = { tags: ['Reviews'], body: ReviewBody }
export const getReviewSchema: FastifySchema = { tags: ['Reviews'], params: IdParams }
export const listProductReviewsSchema: FastifySchema = { tags: ['Reviews'], params: ProductIdParams }
export const listUserReviewsSchema: FastifySchema = { tags: ['Reviews'], params: UserIdParams }
export const updateReviewSchema: FastifySchema = { tags: ['Reviews'], params: IdParams, body: UpdateReviewBody }
export const verifyPurchaseSchema: FastifySchema = { tags: ['Reviews'], params: IdParams }
export const deleteReviewSchema: FastifySchema = { tags: ['Reviews'], params: IdParams }
