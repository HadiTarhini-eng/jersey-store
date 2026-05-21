import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })
const SlotParams = Type.Object({ slot: Type.String({ minLength: 1 }) })

const SlotQuery = Type.Object({ isActive: Type.Optional(Type.Boolean()) })
export type SlotQueryType = Static<typeof SlotQuery>

const UpdateUiContentBody = Type.Partial(Type.Object({
  payload: Type.Record(Type.String(), Type.Unknown()),
  sortOrder: Type.Integer({ minimum: 0 }),
  isActive: Type.Boolean(),
}))
export type UpdateUiContentBodyType = Static<typeof UpdateUiContentBody>

const ReorderBody = Type.Object({ sortOrder: Type.Integer({ minimum: 0 }) })
export type ReorderBodyType = Static<typeof ReorderBody>

const UiContentMultipartBody = Type.Object({
  data: Type.Unsafe<unknown>({ type: 'string', description: 'JSON string with {slot, payload, sortOrder?}' }),
  image: Type.Optional(Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Optional image. image/*.' })),
})

const ImageUploadBody = Type.Object({
  file: Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Image. image/*.' }),
})

// Multipart: schema documents `consumes` for Swagger but skips body validation
// — @fastify/multipart leaves request.body undefined and the handler parses
// parts manually via request.parts().
export const createUiContentSchema: FastifySchema = { tags: ['UiContent'], consumes: ['multipart/form-data'], description: 'Multipart: `data` (JSON) + optional `image` (file).' }
export const listUiContentBySlotSchema: FastifySchema = { tags: ['UiContent'], params: SlotParams, querystring: SlotQuery }
export const getUiContentSchema: FastifySchema = { tags: ['UiContent'], params: IdParams }
export const updateUiContentSchema: FastifySchema = { tags: ['UiContent'], params: IdParams, body: UpdateUiContentBody }
export const setUiContentImageSchema: FastifySchema = { tags: ['UiContent'], consumes: ['multipart/form-data'], params: IdParams, description: 'Multipart: `file` (image).' }
export const removeUiContentImageSchema: FastifySchema = { tags: ['UiContent'], params: IdParams }
export const reorderUiContentSchema: FastifySchema = { tags: ['UiContent'], params: IdParams, body: ReorderBody }
export const activateUiContentSchema: FastifySchema = { tags: ['UiContent'], params: IdParams }
export const deactivateUiContentSchema: FastifySchema = { tags: ['UiContent'], params: IdParams }
export const deleteUiContentSchema: FastifySchema = { tags: ['UiContent'], params: IdParams }
