import type { RouteOptions } from 'fastify'
import type { IUiContentService } from '../../../../core/services/ui-content.svc.js'
import * as ctrl from '../../controllers/ui-content.ctrl.js'
import * as s from '../../schemas/ui-content.schemas.js'

export const uiContentRoutes = (service: IUiContentService): RouteOptions[] => [
  { method: 'POST',   url: '/ui-content',                       roles: ['Admin'], schema: s.createUiContentSchema,        handler: ctrl.createUiContent(service) },
  { method: 'GET',    url: '/ui-content/slots/:slot',           protected: false, schema: s.listUiContentBySlotSchema,    handler: ctrl.listUiContentBySlot(service) },
  { method: 'GET',    url: '/ui-content/:id',                   protected: false, schema: s.getUiContentSchema,           handler: ctrl.getUiContent(service) },
  { method: 'PATCH',  url: '/ui-content/:id',                   roles: ['Admin'], schema: s.updateUiContentSchema,        handler: ctrl.updateUiContent(service) },
  { method: 'POST',   url: '/ui-content/:id/image',             roles: ['Admin'], schema: s.setUiContentImageSchema,      handler: ctrl.setUiContentImage(service) },
  { method: 'DELETE', url: '/ui-content/:id/image',             roles: ['Admin'], schema: s.removeUiContentImageSchema,   handler: ctrl.removeUiContentImage(service) },
  { method: 'PATCH',  url: '/ui-content/:id/reorder',           roles: ['Admin'], schema: s.reorderUiContentSchema,       handler: ctrl.reorderUiContent(service) },
  { method: 'POST',   url: '/ui-content/:id/activate',          roles: ['Admin'], schema: s.activateUiContentSchema,      handler: ctrl.activateUiContent(service) },
  { method: 'POST',   url: '/ui-content/:id/deactivate',        roles: ['Admin'], schema: s.deactivateUiContentSchema,    handler: ctrl.deactivateUiContent(service) },
  { method: 'DELETE', url: '/ui-content/:id',                   roles: ['Admin'], schema: s.deleteUiContentSchema,        handler: ctrl.deleteUiContent(service) },
]
