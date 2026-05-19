import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IAttachmentService } from '../../../core/services/attachment.svc.js'
import { ValidationError } from '../../services/errors.js'
import { readFilePart } from '../utils/readFilePart.js'
import { sendDeleted, sendOk } from '../routes/route-utils.js'
import type { RenameBodyType, ReorderBodyType } from '../schemas/attachment.schemas.js'

type IdParams = { id: string }

const readUploadedFile = async (request: FastifyRequest) => {
  const part = await request.file()
  if (!part) throw new ValidationError('No file uploaded (expected multipart field "file")')
  return readFilePart(part)
}

export const getAttachmentById = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    sendOk(reply, await service.getById(id))
  }

export const renameAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { fileName } = request.body as RenameBodyType
    sendOk(reply, await service.rename(id, fileName))
  }

export const reorderAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { sortOrder } = request.body as ReorderBodyType
    sendOk(reply, await service.reorder(id, sortOrder))
  }

export const replaceAttachmentFile = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const file = await readUploadedFile(request)
    sendOk(reply, await service.replaceFile(id, file))
  }

export const deleteAttachment = (service: IAttachmentService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    await service.delete(id)
    sendDeleted(reply)
  }
