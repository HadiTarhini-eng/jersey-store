import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const AttachmentBody = Type.Object({
  id: Type.Optional(Type.String()),
  fileName: Type.String({ minLength: 1, maxLength: 255 }),
  fileUrl: Type.String({ minLength: 1, maxLength: 2048 }),
  mimeType: Type.String({ minLength: 1, maxLength: 100 }),
  fileSize: Type.Number({ minimum: 0 }),
  uploadedBy: Type.String(),
  isActive: Type.Optional(Type.Boolean()),
})
export type AttachmentBodyType = Static<typeof AttachmentBody>

const IdParams = Type.Object({ id: Type.String() })
const UserIdParams = Type.Object({ userId: Type.String() })

const RenameBody = Type.Object({ fileName: Type.String({ minLength: 1, maxLength: 255 }) })
export type RenameBodyType = Static<typeof RenameBody>

const ReplaceFileBody = Type.Object({
  fileUrl: Type.String({ minLength: 1, maxLength: 2048 }),
  mimeType: Type.String({ minLength: 1, maxLength: 100 }),
  fileSize: Type.Number({ minimum: 0 }),
})
export type ReplaceFileBodyType = Static<typeof ReplaceFileBody>

export const createAttachmentSchema: FastifySchema = { tags: ['Attachments'], body: AttachmentBody }
export const getAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams }
export const getUserAttachmentsSchema: FastifySchema = { tags: ['Attachments'], params: UserIdParams }
export const renameAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams, body: RenameBody }
export const replaceAttachmentFileSchema: FastifySchema = { tags: ['Attachments'], params: IdParams, body: ReplaceFileBody }
export const deleteAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams }
