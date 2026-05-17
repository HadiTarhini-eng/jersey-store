import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })
const UserIdParams = Type.Object({ userId: Type.String() })

const RenameBody = Type.Object({ fileName: Type.String({ minLength: 1, maxLength: 255 }) })
export type RenameBodyType = Static<typeof RenameBody>

const MultipartFormDataBody = Type.Object({
  file: Type.Unsafe<unknown>({
    type: 'string',
    format: 'binary',
    description: 'Image file (image/jpeg, image/png, image/webp, image/gif). Max 2 MB.',
  }),
})

export const uploadAttachmentSchema: FastifySchema = {
  tags: ['Attachments'],
  consumes: ['multipart/form-data'],
  body: MultipartFormDataBody,
}

export const replaceAttachmentFileSchema: FastifySchema = {
  tags: ['Attachments'],
  consumes: ['multipart/form-data'],
  params: IdParams,
  body: MultipartFormDataBody,
}

export const getAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams }
export const getUserAttachmentsSchema: FastifySchema = { tags: ['Attachments'], params: UserIdParams }
export const renameAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams, body: RenameBody }
export const deleteAttachmentSchema: FastifySchema = { tags: ['Attachments'], params: IdParams }
