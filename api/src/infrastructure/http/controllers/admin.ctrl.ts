import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IAdminService } from '../../../core/services/admin.svc.js'
import { ServiceError } from '../../services/errors.js'
import { sendOk } from '../routes/route-utils.js'

export const listAdminCustomers = (service: IAdminService) =>
  async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listCustomers())
  }

export const listAdminOrders = (service: IAdminService) =>
  async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.listOrders())
  }

export const getAdminOrder = (service: IAdminService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string }
    const order = await service.getOrder(id)
    if (!order) throw new ServiceError('Order not found', 404)
    sendOk(reply, order)
  }
