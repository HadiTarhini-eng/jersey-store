import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })
const OrderNumberParams = Type.Object({ orderNumber: Type.String() })
const UserIdParams = Type.Object({ userId: Type.String() })

const AddressSchema = Type.Object({
  fullName: Type.String({ minLength: 1 }),
  phone: Type.String({ minLength: 1, maxLength: 40 }),
  addressLine1: Type.String({ minLength: 1, maxLength: 255 }),
  addressLine2: Type.Optional(Type.String()),
  city: Type.String({ minLength: 1 }),
  state: Type.Optional(Type.String()),
  postalCode: Type.Optional(Type.String()),
  country: Type.String({ minLength: 1 }),
})

const OrderStatusEnum = Type.Union([
  Type.Literal('pending'), Type.Literal('confirmed'), Type.Literal('processing'),
  Type.Literal('shipped'), Type.Literal('delivered'), Type.Literal('cancelled'),
])

const PaymentStatusEnum = Type.Union([
  Type.Literal('pending'), Type.Literal('authorized'), Type.Literal('paid'),
  Type.Literal('failed'), Type.Literal('refunded'),
])

const OrderItemBody = Type.Object({
  id: Type.Optional(Type.String()),
  productVariantId: Type.String(),
  productTitleSnapshot: Type.String({ minLength: 1 }),
  variantSnapshot: Type.Optional(Type.Record(Type.String(), Type.Any())),
  quantity: Type.Integer({ minimum: 1 }),
  unitPrice: Type.Number({ minimum: 0 }),
  totalPrice: Type.Optional(Type.Number({ minimum: 0 })),
  isActive: Type.Optional(Type.Boolean()),
})

const OrderBody = Type.Object({
  id: Type.Optional(Type.String()),
  userId: Type.String(),
  orderNumber: Type.String({ minLength: 1, maxLength: 80 }),
  status: Type.Optional(OrderStatusEnum),
  paymentStatus: Type.Optional(PaymentStatusEnum),
  subtotal: Type.Number({ minimum: 0 }),
  discountAmount: Type.Optional(Type.Number({ minimum: 0 })),
  shippingAmount: Type.Optional(Type.Number({ minimum: 0 })),
  totalAmount: Type.Optional(Type.Number({ minimum: 0 })),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  isActive: Type.Optional(Type.Boolean()),
})

const CreateOrderBody = Type.Object({
  order: OrderBody,
  items: Type.Array(OrderItemBody, { minItems: 1 }),
})
export type CreateOrderBodyType = Static<typeof CreateOrderBody>

const UpdateStatusBody = Type.Object({ status: OrderStatusEnum })
export type UpdateStatusBodyType = Static<typeof UpdateStatusBody>

const UpdatePaymentBody = Type.Object({ paymentStatus: PaymentStatusEnum })
export type UpdatePaymentBodyType = Static<typeof UpdatePaymentBody>

const UpdateAddressesBody = Type.Object({
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
})
export type UpdateAddressesBodyType = Static<typeof UpdateAddressesBody>

export const createOrderSchema: FastifySchema = { tags: ['Orders'], body: CreateOrderBody }
export const getOrderSchema: FastifySchema = { tags: ['Orders'], params: IdParams }
export const getOrderByNumberSchema: FastifySchema = { tags: ['Orders'], params: OrderNumberParams }
export const listUserOrdersSchema: FastifySchema = { tags: ['Orders'], params: UserIdParams }
export const listOrderItemsSchema: FastifySchema = { tags: ['OrderItems'], params: IdParams }
export const placeOrderSchema: FastifySchema = { tags: ['Orders'], params: IdParams }
export const updateOrderStatusSchema: FastifySchema = { tags: ['Orders'], params: IdParams, body: UpdateStatusBody }
export const updatePaymentStatusSchema: FastifySchema = { tags: ['Orders'], params: IdParams, body: UpdatePaymentBody }
export const updateOrderAddressesSchema: FastifySchema = { tags: ['Orders'], params: IdParams, body: UpdateAddressesBody }
export const cancelOrderSchema: FastifySchema = { tags: ['Orders'], params: IdParams }
