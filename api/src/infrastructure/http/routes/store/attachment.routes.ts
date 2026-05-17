import type { RouteOptions } from 'fastify'
import type { IAttachmentService } from '../../../../core/services/attachment.svc.js'
import * as ctrl from '../../controllers/attachment.ctrl.js'
import * as s from '../../schemas/attachment.schemas.js'

export const attachmentRoutes = (service: IAttachmentService): RouteOptions[] => [
  { method: 'POST', url: '/attachments',                     roles: ['Admin', 'User'], schema: s.createAttachmentSchema,       handler: ctrl.createAttachment(service) },
  { method: 'GET',  url: '/attachments/:id',                 roles: ['Admin', 'User'], schema: s.getAttachmentSchema,          handler: ctrl.getAttachmentById(service) },
  { method: 'GET',  url: '/users/:userId/attachments',       roles: ['Admin', 'User'], schema: s.getUserAttachmentsSchema,     handler: ctrl.getAttachmentsByUser(service) },
  { method: 'PATCH', url: '/attachments/:id/name',           roles: ['Admin', 'User'], schema: s.renameAttachmentSchema,       handler: ctrl.renameAttachment(service) },
  { method: 'PATCH', url: '/attachments/:id/file',           roles: ['Admin', 'User'], schema: s.replaceAttachmentFileSchema,  handler: ctrl.replaceAttachmentFile(service) },
  { method: 'DELETE', url: '/attachments/:id',               roles: ['Admin'],         schema: s.deleteAttachmentSchema,       handler: ctrl.deleteAttachment(service) },
]
