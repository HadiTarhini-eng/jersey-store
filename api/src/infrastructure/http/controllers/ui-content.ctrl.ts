import type { FastifyReply, FastifyRequest } from 'fastify'
import type { UiContentSlot } from '../../../core/entities/ui-content.js'
import type { CreateUiContentInput, IUiContentService } from '../../../core/services/ui-content.svc.js'
import type { ImageFile } from '../../../core/services/storage.svc.js'
import { ValidationError } from '../../services/errors.js'
import { jwtUser, sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import { readFilePart } from '../utils/readFilePart.js'
import type { ReorderBodyType, SlotQueryType, UpdateUiContentBodyType } from '../schemas/ui-content.schemas.js'

type IdParams = { id: string }
type SlotParams = { slot: string }

const parseUiContentMultipart = async (request: FastifyRequest): Promise<{
  data: { slot: UiContentSlot; payload: Record<string, unknown>; sortOrder?: number }
  image?: ImageFile
}> => {
  let dataJson: string | undefined
  let image: ImageFile | undefined

  for await (const part of request.parts()) {
    if (part.type === 'file' && part.fieldname === 'image') {
      image = await readFilePart(part)
    } else if (part.type === 'field' && part.fieldname === 'data') {
      dataJson = String(part.value)
    }
  }

  if (!dataJson) throw new ValidationError('Missing "data" field with ui-content JSON payload')
  try {
    return { data: JSON.parse(dataJson), image }
  } catch {
    throw new ValidationError('"data" field is not valid JSON')
  }
}

const readSingleImageUpload = async (request: FastifyRequest): Promise<ImageFile> => {
  const part = await request.file()
  if (!part) throw new ValidationError('No file uploaded (expected multipart field "file")')
  return readFilePart(part)
}

export const createUiContent = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { data, image } = await parseUiContentMultipart(request)
    const { id: uploadedBy } = jwtUser(request)
    const input: CreateUiContentInput = {
      slot: data.slot,
      payload: data.payload ?? {},
      sortOrder: data.sortOrder,
      uploadedBy,
      image,
    }
    sendCreated(reply, await service.create(input))
  }

export const listUiContentBySlot = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { slot } = request.params as SlotParams
    const query = request.query as SlotQueryType
    sendOk(reply, await service.listBySlot(slot as UiContentSlot, query))
  }

export const getUiContent = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getById((request.params as IdParams).id))
  }

export const updateUiContent = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.update((request.params as IdParams).id, request.body as UpdateUiContentBodyType))
  }

export const setUiContentImage = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id: uploadedBy } = jwtUser(request)
    const file = await readSingleImageUpload(request)
    sendOk(reply, await service.setImage((request.params as IdParams).id, file, uploadedBy))
  }

export const removeUiContentImage = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.removeImage((request.params as IdParams).id))
  }

export const reorderUiContent = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { sortOrder } = request.body as ReorderBodyType
    sendOk(reply, await service.reorder((request.params as IdParams).id, sortOrder))
  }

export const activateUiContent = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.activate((request.params as IdParams).id))
  }

export const deactivateUiContent = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivate((request.params as IdParams).id))
  }

export const deleteUiContent = (service: IUiContentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await service.delete((request.params as IdParams).id)
    sendDeleted(reply)
  }
