import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })

const CategoryTypeBody = Type.Object({
  id: Type.Optional(Type.String()),
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
})
export type CategoryTypeBodyType = Static<typeof CategoryTypeBody>

const UpdateCategoryTypeBody = Type.Partial(CategoryTypeBody)
export type UpdateCategoryTypeBodyType = Static<typeof UpdateCategoryTypeBody>

const CategoryBody = Type.Object({
  id: Type.Optional(Type.String()),
  categoryTypeId: Type.String(),
  parentId: Type.Optional(Type.String()),
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  imageId: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
})
export type CategoryBodyType = Static<typeof CategoryBody>

const UpdateCategoryBody = Type.Partial(CategoryBody)
export type UpdateCategoryBodyType = Static<typeof UpdateCategoryBody>

const CategoryQuery = Type.Object({
  categoryTypeId: Type.Optional(Type.String()),
  parentId: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
})
export type CategoryQueryType = Static<typeof CategoryQuery>

const MoveBody = Type.Object({ parentId: Type.Optional(Type.String()) })
export type MoveBodyType = Static<typeof MoveBody>

const SetImageBody = Type.Object({ imageId: Type.Optional(Type.String()) })
export type SetImageBodyType = Static<typeof SetImageBody>

export const createCategoryTypeSchema: FastifySchema = { tags: ['CategoryTypes'], body: CategoryTypeBody }
export const listCategoryTypesSchema: FastifySchema = { tags: ['CategoryTypes'] }
export const getCategoryTypeSchema: FastifySchema = { tags: ['CategoryTypes'], params: IdParams }
export const updateCategoryTypeSchema: FastifySchema = { tags: ['CategoryTypes'], params: IdParams, body: UpdateCategoryTypeBody }
export const deleteCategoryTypeSchema: FastifySchema = { tags: ['CategoryTypes'], params: IdParams }

export const createCategorySchema: FastifySchema = { tags: ['Categories'], body: CategoryBody }
export const listCategoriesSchema: FastifySchema = { tags: ['Categories'], querystring: CategoryQuery }
export const getCategorySchema: FastifySchema = { tags: ['Categories'], params: IdParams }
export const getCategoryChildrenSchema: FastifySchema = { tags: ['Categories'], params: IdParams }
export const updateCategorySchema: FastifySchema = { tags: ['Categories'], params: IdParams, body: UpdateCategoryBody }
export const moveCategorySchema: FastifySchema = { tags: ['Categories'], params: IdParams, body: MoveBody }
export const setCategoryImageSchema: FastifySchema = { tags: ['Categories'], params: IdParams, body: SetImageBody }
export const activateCategorySchema: FastifySchema = { tags: ['Categories'], params: IdParams }
export const deleteCategorySchema: FastifySchema = { tags: ['Categories'], params: IdParams }
