import type { FastifyReply, FastifyRequest } from 'fastify'
import { Order, OrderItem } from '../../../core/entities/commerce.js'
import type { IOrderService } from '../../../core/services/commerce.svc.js'
import { NotFoundError } from '../../services/errors.js'
import { assertOwner, sendCreated, sendOk } from '../routes/route-utils.js'
import type {
  CreateGuestOrderBodyType, CreateOrderBodyType, UpdateAddressesBodyType, UpdatePaymentBodyType, UpdateStatusBodyType,
} from '../schemas/order.schemas.js'

type IdParams = { id: string }
type OrderNumberParams = { orderNumber: string }
type UserIdParams = { userId: string }

export const createOrder = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as CreateOrderBodyType
    assertOwner(request, body.order.userId)
    const order = new Order(body.order as any)
    const items = body.items.map((item) => new OrderItem({ ...item, orderId: order.id } as any))
    sendCreated(reply, await service.createOrder(order, items))
  }

export const createGuestOrder = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as CreateGuestOrderBodyType
    // The route is unprotected so guests can checkout, but we still try to
    // verify a JWT if the client sent one — that way a logged-in customer's
    // order gets attributed to them instead of orphaned as a true guest.
    // Failures are swallowed; on success `request.user` carries the user id.
    let userId: string | null = null
    try {
      await request.jwtVerify()
      userId = (request.user as { id?: string } | undefined)?.id ?? null
    } catch {
      userId = null
    }

    const result = await service.createGuestOrder({
      userId,
      guestEmail: body.guestEmail ?? null,
      couponCode: body.couponCode ?? null,
      couponItemsApplied: body.couponItemsApplied ?? null,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      items: body.items,
    })
    sendCreated(reply, result)
  }

export const getOrderById = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const order = await service.getOrderById(id)
    if (!order) throw new NotFoundError('Order')
    assertOwner(request, order.userId)
    sendOk(reply, order)
  }

export const getOrderByNumber = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { orderNumber } = request.params as OrderNumberParams
    const order = await service.getOrderByNumber(orderNumber)
    if (!order) throw new NotFoundError('Order')
    assertOwner(request, order.userId)
    sendOk(reply, order)
  }

export const listUserOrders = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params as UserIdParams
    assertOwner(request, userId)
    sendOk(reply, await service.listUserOrders(userId))
  }

export const listOrderItems = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const order = await service.getOrderById(id)
    if (!order) throw new NotFoundError('Order')
    assertOwner(request, order.userId)
    sendOk(reply, await service.listOrderItems(id))
  }

export const placeOrder = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const order = await service.getOrderById(id)
    if (!order) throw new NotFoundError('Order')
    assertOwner(request, order.userId)
    sendOk(reply, await service.placeOrder(id))
  }

export const updateOrderStatus = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { status, rejectionReason } = request.body as UpdateStatusBodyType
    sendOk(reply, await service.updateOrderStatus(id, status, rejectionReason ?? null))
  }

export const markAdminMessageRead = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const order = await service.getOrderById(id)
    if (!order) throw new NotFoundError('Order')
    // Owner-only: customer dismisses their own message. Admins are allowed
    // through `assertOwner` already.
    assertOwner(request, order.userId)
    sendOk(reply, await service.markAdminMessageRead(id))
  }

export const updatePaymentStatus = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const { paymentStatus } = request.body as UpdatePaymentBodyType
    sendOk(reply, await service.updatePaymentStatus(id, paymentStatus))
  }

export const updateOrderAddresses = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const order = await service.getOrderById(id)
    if (!order) throw new NotFoundError('Order')
    assertOwner(request, order.userId)
    const { shippingAddress, billingAddress } = request.body as UpdateAddressesBodyType
    sendOk(reply, await service.updateAddresses(id, shippingAddress, billingAddress))
  }

export const cancelOrder = (service: IOrderService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const order = await service.getOrderById(id)
    if (!order) throw new NotFoundError('Order')
    assertOwner(request, order.userId)
    sendOk(reply, await service.cancelOrder(id))
  }
