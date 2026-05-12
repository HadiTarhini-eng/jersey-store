import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })
const ProductIdParams = Type.Object({ productId: Type.String() })
const OfferProductParams = Type.Object({ offerId: Type.String(), productId: Type.String() })

const OfferBody = Type.Object({
  id: Type.Optional(Type.String()),
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  discountType: Type.Union([Type.Literal('percentage'), Type.Literal('fixed_amount')]),
  discountValue: Type.Number({ exclusiveMinimum: 0 }),
  startDate: Type.String(),
  endDate: Type.String(),
  bannerAttachmentId: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
})
export type OfferBodyType = Static<typeof OfferBody>

const UpdateOfferBody = Type.Partial(OfferBody)
export type UpdateOfferBodyType = Static<typeof UpdateOfferBody>

const ActiveOffersQuery = Type.Object({ date: Type.Optional(Type.String()) })
export type ActiveOffersQueryType = Static<typeof ActiveOffersQuery>

const RescheduleBody = Type.Object({ startDate: Type.String(), endDate: Type.String() })
export type RescheduleBodyType = Static<typeof RescheduleBody>

export const createOfferSchema: FastifySchema = { tags: ['Offers'], body: OfferBody }
export const listActiveOffersSchema: FastifySchema = { tags: ['Offers'], querystring: ActiveOffersQuery }
export const getOfferSchema: FastifySchema = { tags: ['Offers'], params: IdParams }
export const listOffersForProductSchema: FastifySchema = { tags: ['Offers'], params: ProductIdParams }
export const updateOfferSchema: FastifySchema = { tags: ['Offers'], params: IdParams, body: UpdateOfferBody }
export const attachProductSchema: FastifySchema = { tags: ['Offers'], params: OfferProductParams }
export const detachProductSchema: FastifySchema = { tags: ['Offers'], params: OfferProductParams }
export const rescheduleOfferSchema: FastifySchema = { tags: ['Offers'], params: IdParams, body: RescheduleBody }
export const activateOfferSchema: FastifySchema = { tags: ['Offers'], params: IdParams }
export const deactivateOfferSchema: FastifySchema = { tags: ['Offers'], params: IdParams }
