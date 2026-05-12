import type { FastifyReply, FastifyRequest } from 'fastify'
import { Category, CategoryType } from '../../../core/entities/catalog.js'
import type { ICategoryService, ICategoryTypeService } from '../../../core/services/catalog.svc.js'
import { sendCreated, sendOk } from '../routes/route-utils.js'
import type {
  CategoryBodyType, CategoryQueryType, CategoryTypeBodyType,
  MoveBodyType, SetImageBodyType, UpdateCategoryBodyType, UpdateCategoryTypeBodyType,
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

export const createCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendCreated(reply, await service.createCategory(new Category(request.body as CategoryBodyType)))
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
    sendOk(reply, await service.setCategoryImage((request.params as IdParams).id, (request.body as SetImageBodyType).imageId))
  }

export const activateCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.activateCategory((request.params as IdParams).id))
  }

export const deactivateCategory = (service: ICategoryService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.deactivateCategory((request.params as IdParams).id))
  }
