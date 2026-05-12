import type { RouteOptions } from 'fastify'
import type { ISpecialOfferService } from '../../../../core/services/offer.svc.js'
import * as ctrl from '../../controllers/offer.ctrl.js'
import * as s from '../../schemas/offer.schemas.js'

export const offerRoutes = (service: ISpecialOfferService): RouteOptions[] => [
  { method: 'POST',   url: '/offers',                              roles: ['Admin'],  schema: s.createOfferSchema,          handler: ctrl.createOffer(service) },
  { method: 'GET',    url: '/offers/active',                       protected: false,  schema: s.listActiveOffersSchema,     handler: ctrl.listActiveOffers(service) },
  { method: 'GET',    url: '/offers/:id',                          protected: false,  schema: s.getOfferSchema,             handler: ctrl.getOfferById(service) },
  { method: 'GET',    url: '/products/:productId/offers',          protected: false,  schema: s.listOffersForProductSchema, handler: ctrl.listOffersForProduct(service) },
  { method: 'PATCH',  url: '/offers/:id',                          roles: ['Admin'],  schema: s.updateOfferSchema,          handler: ctrl.updateOffer(service) },
  { method: 'POST',   url: '/offers/:offerId/products/:productId', roles: ['Admin'],  schema: s.attachProductSchema,        handler: ctrl.attachProduct(service) },
  { method: 'DELETE', url: '/offers/:offerId/products/:productId', roles: ['Admin'],  schema: s.detachProductSchema,        handler: ctrl.detachProduct(service) },
  { method: 'PATCH',  url: '/offers/:id/schedule',                 roles: ['Admin'],  schema: s.rescheduleOfferSchema,      handler: ctrl.rescheduleOffer(service) },
  { method: 'POST',   url: '/offers/:id/activate',                 roles: ['Admin'],  schema: s.activateOfferSchema,        handler: ctrl.activateOffer(service) },
  { method: 'DELETE', url: '/offers/:id',                          roles: ['Admin'],  schema: s.deactivateOfferSchema,      handler: ctrl.deactivateOffer(service) },
]
