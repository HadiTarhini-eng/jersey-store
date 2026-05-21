import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })

const RenameBody = Type.Object({ fileName: Type.String({ minLength: 1, maxLength: 255 }) })
export type RenameBodyType = Static<typeof RenameBody>

const ReorderBody = Type.Object({ sortOrder: Type.Integer({ minimum: 0 }) })
export type ReorderBodyType = Static<typeof ReorderBody>

const MultipartFormDataBody = Type.Object({
  file: Type.Unsafe<unknown>({
    type: 'string',
    format: 'binary',
    description: 'Image file (image/jpeg, image/png, image/webp, image/gif). Max 5 MB.',
  }),
})

// Multipart: handler parses `file` part via request.file().
export const replaceAttachmentFileSchema: FastifySchema = {
  tags: ['Attachments'],
  consumes: ['multipart/form-data'],
  params: IdParams,
  description: 'Multipart: `file` (replacement image).',
}

export const getAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams }
export const renameAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams, body: RenameBody }
export const reorderAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams, body: ReorderBody }
export const deleteAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams }
