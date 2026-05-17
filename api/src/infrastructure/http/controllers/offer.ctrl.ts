import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateOfferInput, ISpecialOfferService } from '../../../core/services/offer.svc.js'
import type { ImageFile } from '../../../core/services/storage.svc.js'
import { ValidationError } from '../../services/errors.js'
import { jwtUser, sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import type { ActiveOffersQueryType, RescheduleBodyType, UpdateOfferBodyType } from '../schemas/offer.schemas.js'

type IdParams = { id: string }
type ProductIdParams = { productId: string }
type OfferProductParams = { offerId: string; productId: string }

const coerceDates = (data: Record<string, any>): Record<string, any> => ({
  ...data,
  ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
  ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
})

const parseOfferMultipart = async (request: FastifyRequest): Promise<{
  data: CreateOfferInput['data']
  banner?: ImageFile
}> => {
  let dataJson: string | undefined
  let banner: ImageFile | undefined

  for await (const part of request.parts()) {
    if (part.type === 'file' && part.fieldname === 'banner') {
      banner = { data: await part.toBuffer(), fileName: part.filename, mimeType: part.mimetype }
    } else if (part.type === 'field' && part.fieldname === 'data') {
      dataJson = String(part.value)
    }
  }

  if (!dataJson) throw new ValidationError('Missing "data" field with offer JSON payload')
  try {
    const parsed = JSON.parse(dataJson) as Record<string, unknown>
    return { data: coerceDates(parsed) as CreateOfferInput['data'], banner }
  } catch {
    throw new ValidationError('"data" field is not valid JSON')
  }
}

const readSingleImageUpload = async (request: FastifyRequest): Promise<ImageFile> => {
  const file = await request.file()
  if (!file) throw new ValidationError('No file uploaded (expected multipart field "file")')
  return { data: await file.toBuffer(), fileName: file.filename, mimeType: file.mimetype }
}

export const createOffer = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { data, banner } = await parseOfferMultipart(request)
    const { id: uploadedBy } = jwtUser(request)
    sendCreated(reply, await service.createOffer({ data, banner, uploadedBy }))
  }

export const setOfferBanner = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { id: uploadedBy } = jwtUser(request)
    const file = await readSingleImageUpload(request)
    sendOk(reply, await service.setOfferBanner(id, file, uploadedBy))
  }

export const removeOfferBanner = (service: ISpecialOfferService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.removeOfferBanner((request.params as IdParams).id))
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
