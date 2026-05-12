import type { RouteOptions } from 'fastify'
import type { IOrderService } from '../../../../core/services/commerce.svc.js'
import * as ctrl from '../../controllers/order.ctrl.js'
import * as s from '../../schemas/order.schemas.js'

export const orderRoutes = (service: IOrderService): RouteOptions[] => [
  { method: 'POST',  url: '/orders',                       roles: ['User', 'Admin'], schema: s.createOrderSchema,          handler: ctrl.createOrder(service) },
  { method: 'GET',   url: '/orders/:id',                   roles: ['User', 'Admin'], schema: s.getOrderSchema,             handler: ctrl.getOrderById(service) },
  { method: 'GET',   url: '/orders/number/:orderNumber',   roles: ['User', 'Admin'], schema: s.getOrderByNumberSchema,     handler: ctrl.getOrderByNumber(service) },
  { method: 'GET',   url: '/users/:userId/orders',         roles: ['User', 'Admin'], schema: s.listUserOrdersSchema,       handler: ctrl.listUserOrders(service) },
  { method: 'GET',   url: '/orders/:id/items',             roles: ['User', 'Admin'], schema: s.listOrderItemsSchema,       handler: ctrl.listOrderItems(service) },
  { method: 'POST',  url: '/orders/:id/place',             roles: ['User', 'Admin'], schema: s.placeOrderSchema,           handler: ctrl.placeOrder(service) },
  { method: 'PATCH', url: '/orders/:id/status',            roles: ['Admin'],         schema: s.updateOrderStatusSchema,    handler: ctrl.updateOrderStatus(service) },
  { method: 'PATCH', url: '/orders/:id/payment',           roles: ['Admin'],         schema: s.updatePaymentStatusSchema,  handler: ctrl.updatePaymentStatus(service) },
  { method: 'PATCH', url: '/orders/:id/addresses',         roles: ['User', 'Admin'], schema: s.updateOrderAddressesSchema, handler: ctrl.updateOrderAddresses(service) },
  { method: 'POST',  url: '/orders/:id/cancel',            roles: ['User', 'Admin'], schema: s.cancelOrderSchema,          handler: ctrl.cancelOrder(service) },
]
