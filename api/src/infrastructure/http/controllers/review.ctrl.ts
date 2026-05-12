import type { FastifyReply, FastifyRequest } from 'fastify'
import { Review } from '../../../core/entities/commerce.js'
import type { IReviewService } from '../../../core/services/commerce.svc.js'
import { NotFoundError } from '../../services/errors.js'
import { assertOwner, sendCreated, sendOk } from '../routes/route-utils.js'
import type { ReviewBodyType, UpdateReviewBodyType } from '../schemas/review.schemas.js'

type IdParams = { id: string }
type ProductIdParams = { productId: string }
type UserIdParams = { userId: string }

export const createReview = (service: IReviewService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as ReviewBodyType
    assertOwner(request, body.userId)
    sendCreated(reply, await service.createReview(new Review(body as any)))
  }

export const getReviewById = (service: IReviewService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getReviewById((request.params as IdParams).id))
  }

export const listProductReviews = (service: IReviewService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listProductReviews((request.params as ProductIdParams).productId))
  }

export const listUserReviews = (service: IReviewService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params as UserIdParams
    assertOwner(request, userId)
    sendOk(reply, await service.listUserReviews(userId))
  }

export const updateReview = (service: IReviewService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const review = await service.getReviewById(id)
    if (!review) throw new NotFoundError('Review')
    assertOwner(request, review.userId)
    sendOk(reply, await service.updateReview(id, request.body as UpdateReviewBodyType))
  }

export const markVerifiedPurchase = (service: IReviewService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.markVerifiedPurchase((request.params as IdParams).id))
  }

export const deactivateReview = (service: IReviewService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const review = await service.getReviewById(id)
    if (!review) throw new NotFoundError('Review')
    assertOwner(request, review.userId)
    sendOk(reply, await service.deactivateReview(id))
  }
