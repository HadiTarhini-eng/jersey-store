import type { RouteOptions } from 'fastify'
import type { IShippingMethodService, ISiteConfigService } from '../../../../core/services/config.svc.js'
import * as ctrl from '../../controllers/config.ctrl.js'
import * as s from '../../schemas/config.schemas.js'

export const configRoutes = (
  siteConfigService: ISiteConfigService,
  shippingMethodService: IShippingMethodService,
): RouteOptions[] => [
  // Site config — public read, admin write
  { method: 'GET',    url: '/config',                protected: false, schema: s.getSiteConfigSchema,    handler: ctrl.getSiteConfig(siteConfigService) },
  { method: 'PATCH',  url: '/config',                roles: ['Admin'], schema: s.updateSiteConfigSchema, handler: ctrl.updateSiteConfig(siteConfigService) },
  { method: 'POST',   url: '/config/logo',           roles: ['Admin'], schema: s.setSiteLogoSchema,      handler: ctrl.setSiteLogo(siteConfigService) },
  { method: 'DELETE', url: '/config/logo',           roles: ['Admin'], schema: s.removeSiteLogoSchema,   handler: ctrl.removeSiteLogo(siteConfigService) },

  // Shipping methods — public read of active, admin manage
  { method: 'POST',   url: '/shipping-methods',       roles: ['Admin'], schema: s.createShippingMethodSchema,     handler: ctrl.createShippingMethod(shippingMethodService) },
  { method: 'GET',    url: '/shipping-methods',       protected: false, schema: s.listShippingMethodsSchema,      handler: ctrl.listShippingMethods(shippingMethodService) },
  { method: 'GET',    url: '/shipping-methods/:id',   protected: false, schema: s.getShippingMethodSchema,        handler: ctrl.getShippingMethod(shippingMethodService) },
  { method: 'PATCH',  url: '/shipping-methods/:id',   roles: ['Admin'], schema: s.updateShippingMethodSchema,     handler: ctrl.updateShippingMethod(shippingMethodService) },
  { method: 'POST',   url: '/shipping-methods/:id/activate',   roles: ['Admin'], schema: s.activateShippingMethodSchema,   handler: ctrl.activateShippingMethod(shippingMethodService) },
  { method: 'POST',   url: '/shipping-methods/:id/deactivate', roles: ['Admin'], schema: s.deactivateShippingMethodSchema, handler: ctrl.deactivateShippingMethod(shippingMethodService) },
  { method: 'DELETE', url: '/shipping-methods/:id',   roles: ['Admin'], schema: s.deleteShippingMethodSchema,     handler: ctrl.deleteShippingMethod(shippingMethodService) },
]
