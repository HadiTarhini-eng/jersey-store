import type { FastifyReply, FastifyRequest } from 'fastify'
import { SpecialOffer } from '../../../core/entities/offer.js'
import type { ISpecialOfferService } from '../../../core/services/offer.svc.js'
import { sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import type { ActiveOffersQueryType, OfferBodyType, RescheduleBodyType, UpdateOfferBodyType } from '../schemas/offer.schemas.js'

type IdParams = { id: string }
type ProductIdParams = { productId: string }
type OfferProductParams = { offerId: string; productId: string }

const coerceDates = (data: Record<string, any>): Record<string, any> => ({
  ...data,
  ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
  ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
})

export const createOffer = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as OfferBodyType
    sendCreated(reply, await service.createOffer(new SpecialOffer(coerceDates(body) as any)))
  }

export const listActiveOffers = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { date } = request.query as ActiveOffersQueryType
    sendOk(reply, await service.listActiveOffers(date ? new Date(date) : undefined))
  }

export const getOfferById = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getOfferById((request.params as IdParams).id))
  }

export const listOffersForProduct = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listOffersForProduct((request.params as ProductIdParams).productId))
  }

export const updateOffer = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const body = request.body as UpdateOfferBodyType
    sendOk(reply, await service.updateOffer(id, coerceDates(body) as any))
  }

export const attachProduct = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as OfferProductParams
    sendCreated(reply, await service.attachProduct(params))
  }

export const detachProduct = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { offerId, productId } = request.params as OfferProductParams
    await service.detachProduct(offerId, productId)
    sendDeleted(reply)
  }

export const rescheduleOffer = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { startDate, endDate } = request.body as RescheduleBodyType
    sendOk(reply, await service.rescheduleOffer(id, new Date(startDate), new Date(endDate)))
  }

export const activateOffer = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.activateOffer((request.params as IdParams).id))
  }

export const deactivateOffer = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivateOffer((request.params as IdParams).id))
  }
