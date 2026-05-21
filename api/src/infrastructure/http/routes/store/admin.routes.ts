import type { RouteOptions } from 'fastify'
import type { IAdminService } from '../../../../core/services/admin.svc.js'
import * as ctrl from '../../controllers/admin.ctrl.js'
import * as s from '../../schemas/admin.schemas.js'

export const adminRoutes = (service: IAdminService): RouteOptions[] => [
  { method: 'GET', url: '/admin/customers',     roles: ['Admin'], schema: s.listAdminCustomersSchema, handler: ctrl.listAdminCustomers(service) },
  { method: 'GET', url: '/admin/orders',        roles: ['Admin'], schema: s.listAdminOrdersSchema,    handler: ctrl.listAdminOrders(service) },
  { method: 'GET', url: '/admin/orders/:id',    roles: ['Admin'], schema: s.getAdminOrderSchema,      handler: ctrl.getAdminOrder(service) },
]
