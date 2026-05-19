import type { RouteOptions } from 'fastify'
import type { IAttachmentService } from '../../../../core/services/attachment.svc.js'
import * as ctrl from '../../controllers/attachment.ctrl.js'
import * as s from '../../schemas/attachment.schemas.js'

/**
 * Attachments are now product-only. Creation lives on the products router
 * (`POST /products/:productId/images`); only management endpoints live here.
 */
export const attachmentRoutes = (service: IAttachmentService): RouteOptions[] => [
  { method: 'GET',    url: '/attachments/:id',          protected: false,         schema: s.getAttachmentSchema,         handler: ctrl.getAttachmentById(service) },
  { method: 'PATCH',  url: '/attachments/:id/name',     roles: ['Admin'],         schema: s.renameAttachmentSchema,      handler: ctrl.renameAttachment(service) },
  { method: 'PATCH',  url: '/attachments/:id/reorder',  roles: ['Admin'],         schema: s.reorderAttachmentSchema,     handler: ctrl.reorderAttachment(service) },
  { method: 'PATCH',  url: '/attachments/:id/file',     roles: ['Admin'],         schema: s.replaceAttachmentFileSchema, handler: ctrl.replaceAttachmentFile(service) },
  { method: 'DELETE', url: '/attachments/:id',          roles: ['Admin'],         schema: s.deleteAttachmentSchema,      handler: ctrl.deleteAttachment(service) },
]
