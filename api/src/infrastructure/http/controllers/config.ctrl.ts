import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IShippingMethodService, ISiteConfigService } from '../../../core/services/config.svc.js'
import type { ImageFile } from '../../../core/services/storage.svc.js'
import { ValidationError } from '../../services/errors.js'
import { jwtUser, sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import { readFilePart } from '../utils/readFilePart.js'
import type {
  ShippingListQueryType,
  ShippingMethodBodyType,
  UpdateShippingMethodBodyType,
  UpdateSiteConfigBodyType,
} from '../schemas/config.schemas.js'

type IdParams = { id: string }

const readSingleImageUpload = async (request: FastifyRequest): Promise<ImageFile> => {
  const part = await request.file()
  if (!part) throw new ValidationError('No file uploaded (expected multipart field "file")')
  return readFilePart(part)
}

// ── Site config ──────────────────────────────────────────────────────────────

export const getSiteConfig = (service: ISiteConfigService) =>
  async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getDefault())
  }

export const updateSiteConfig = (service: ISiteConfigService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.updateDefault(request.body as UpdateSiteConfigBodyType))
  }

export const setSiteLogo = (service: ISiteConfigService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id: uploadedBy } = jwtUser(request)
    const file = await readSingleImageUpload(request)
    sendOk(reply, await service.setDefaultLogo(file, uploadedBy))
  }

export const removeSiteLogo = (service: ISiteConfigService) =>
  async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.removeDefaultLogo())
  }

// ── Shipping methods ─────────────────────────────────────────────────────────

export const createShippingMethod = (service: IShippingMethodService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendCreated(reply, await service.create(request.body as ShippingMethodBodyType))
  }

export const listShippingMethods = (service: IShippingMethodService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.list(request.query as ShippingListQueryType))
  }

export const getShippingMethod = (service: IShippingMethodService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getById((request.params as IdParams).id))
  }

export const updateShippingMethod = (service: IShippingMethodService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.update((request.params as IdParams).id, request.body as UpdateShippingMethodBodyType as any))
  }

export const activateShippingMethod = (service: IShippingMethodService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.activate((request.params as IdParams).id))
  }

export const deactivateShippingMethod = (service: IShippingMethodService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivate((request.params as IdParams).id))
  }

export const deleteShippingMethod = (service: IShippingMethodService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await service.delete((request.params as IdParams).id)
    sendDeleted(reply)
  }
