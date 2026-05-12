import type { FastifyReply, FastifyRequest } from 'fastify'
import { Attachment } from '../../../core/entities/attachment.js'
import type { IAttachmentService } from '../../../core/services/attachment.svc.js'
import { assertOwner, sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import type { AttachmentBodyType, RenameBodyType, ReplaceFileBodyType } from '../schemas/attachment.schemas.js'

type IdParams = { id: string }
type UserIdParams = { userId: string }

export const createAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as AttachmentBodyType
    assertOwner(request, body.uploadedBy)
    sendCreated(reply, await service.createAttachment(new Attachment(body)))
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
    const { fileUrl, mimeType, fileSize } = request.body as ReplaceFileBodyType
    sendOk(reply, await service.replaceAttachmentFile(id, fileUrl, mimeType, fileSize))
  }

export const deleteAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    await service.deleteAttachment(id)
    sendDeleted(reply)
  }
