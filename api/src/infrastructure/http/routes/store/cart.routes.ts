import type { RouteOptions } from 'fastify'
import type { ICartService } from '../../../../core/services/commerce.svc.js'
import * as ctrl from '../../controllers/cart.ctrl.js'
import * as s from '../../schemas/cart.schemas.js'

export const cartRoutes = (service: ICartService): RouteOptions[] => [
  { method: 'POST',   url: '/carts',                 roles: ['User', 'Admin'], schema: s.createCartSchema,     handler: ctrl.createCart(service) },
  { method: 'GET',    url: '/users/:userId/cart',    roles: ['User', 'Admin'], schema: s.getUserCartSchema,    handler: ctrl.getUserCart(service) },
  { method: 'POST',   url: '/carts/:cartId/items',  roles: ['User', 'Admin'], schema: s.addCartItemSchema,    handler: ctrl.addCartItem(service) },
  { method: 'GET',    url: '/carts/:cartId/items',  roles: ['User', 'Admin'], schema: s.listCartItemsSchema,  handler: ctrl.listCartItems(service) },
  { method: 'PATCH',  url: '/cart-items/:id',        roles: ['User', 'Admin'], schema: s.updateCartItemSchema, handler: ctrl.updateCartItem(service) },
  { method: 'DELETE', url: '/cart-items/:id',        roles: ['User', 'Admin'], schema: s.removeCartItemSchema, handler: ctrl.removeCartItem(service) },
  { method: 'POST',   url: '/carts/:id/abandon',    roles: ['User', 'Admin'], schema: s.abandonCartSchema,    handler: ctrl.abandonCart(service) },
  { method: 'POST',   url: '/carts/:id/convert',    roles: ['User', 'Admin'], schema: s.convertCartSchema,    handler: ctrl.convertCart(service) },
]
