import type { FastifyReply, FastifyRequest } from 'fastify'
import { CategoryType } from '../../../core/entities/catalog.js'
import type { CreateCategoryInput, ICategoryService, ICategoryTypeService } from '../../../core/services/catalog.svc.js'
import type { ImageFile } from '../../../core/services/storage.svc.js'
import { ValidationError } from '../../services/errors.js'
import { jwtUser, sendCreated, sendOk } from '../routes/route-utils.js'
import { readFilePart } from '../utils/readFilePart.js'
import type {
  CategoryQueryType, CategoryTypeBodyType,
  MoveBodyType, UpdateCategoryBodyType, UpdateCategoryTypeBodyType,
} from '../schemas/category.schemas.js'

type IdParams = { id: string }

// ── CategoryType ─────────────────────────────────────────────────────────────

export const createCategoryType = (service: ICategoryTypeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendCreated(reply, await service.createCategoryType(new CategoryType(request.body as CategoryTypeBodyType)))
  }

export const listCategoryTypes = (service: ICategoryTypeService) =>
  async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listCategoryTypes())
  }

export const getCategoryTypeById = (service: ICategoryTypeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getCategoryTypeById((request.params as IdParams).id))
  }

export const updateCategoryType = (service: ICategoryTypeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.updateCategoryType((request.params as IdParams).id, request.body as UpdateCategoryTypeBodyType))
  }

export const deactivateCategoryType = (service: ICategoryTypeService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivateCategoryType((request.params as IdParams).id))
  }

// ── Category ─────────────────────────────────────────────────────────────────

const parseCategoryMultipart = async (request: FastifyRequest): Promise<{
  data: CreateCategoryInput['data']
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

  if (!dataJson) throw new ValidationError('Missing "data" field with category JSON payload')
  try {
    return { data: JSON.parse(dataJson) as CreateCategoryInput['data'], image }
  } catch {
    throw new ValidationError('"data" field is not valid JSON')
  }
}

const readSingleImageUpload = async (request: FastifyRequest): Promise<ImageFile> => {
  const part = await request.file()
  if (!part) throw new ValidationError('No file uploaded (expected multipart field "file")')
  return readFilePart(part)
}

export const createCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { data, image } = await parseCategoryMultipart(request)
    const { id: uploadedBy } = jwtUser(request)
    sendCreated(reply, await service.createCategory({ data, image, uploadedBy }))
  }

export const listCategories = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listCategories(request.query as CategoryQueryType))
  }

export const getCategoryById = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getCategoryById((request.params as IdParams).id))
  }

export const listCategoryChildren = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listCategoryChildren((request.params as IdParams).id))
  }

export const updateCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.updateCategory((request.params as IdParams).id, request.body as UpdateCategoryBodyType))
  }

export const moveCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.moveCategory((request.params as IdParams).id, (request.body as MoveBodyType).parentId))
  }

export const setCategoryImage = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { id: uploadedBy } = jwtUser(request)
    const file = await readSingleImageUpload(request)
    sendOk(reply, await service.setCategoryImage(id, file, uploadedBy))
  }

export const removeCategoryImage = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.removeCategoryImage((request.params as IdParams).id))
  }

export const activateCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.activateCategory((request.params as IdParams).id))
  }

export const deactivateCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivateCategory((request.params as IdParams).id))
  }
