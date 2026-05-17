import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IAttachmentService } from '../../../core/services/attachment.svc.js'
import { ValidationError } from '../../services/errors.js'
import { jwtUser, assertOwner, sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import type { RenameBodyType } from '../schemas/attachment.schemas.js'

type IdParams = { id: string }
type UserIdParams = { userId: string }

const readUploadedFile = async (request: FastifyRequest) => {
  const file = await request.file()
  if (!file) throw new ValidationError('No file uploaded (expected multipart field "file")')
  const data = await file.toBuffer()
  return { data, fileName: file.filename, mimeType: file.mimetype }
}

export const uploadAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { data, fileName, mimeType } = await readUploadedFile(request)
    const { id: uploadedBy } = jwtUser(request)
    sendCreated(reply, await service.uploadAttachment({ data, fileName, mimeType, uploadedBy }))
  }

export const getAttachmentById = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    sendOk(reply, await service.getAttachmentById(id))
  }

export const getAttachmentsByUser = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params as UserIdParams
    assertOwner(request, userId)
    sendOk(reply, await service.getAttachmentsByUser(userId))
  }

export const renameAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { fileName } = request.body as RenameBodyType
    sendOk(reply, await service.renameAttachment(id, fileName))
  }

export const replaceAttachmentFile = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { data, fileName, mimeType } = await readUploadedFile(request)
    sendOk(reply, await service.replaceAttachmentFile(id, { data, fileName, mimeType }))
  }

export const deleteAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    await service.deleteAttachment(id)
    sendDeleted(reply)
  }
