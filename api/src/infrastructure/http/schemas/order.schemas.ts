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
  Type.Literal('failed'), Type.Literal('refunded'), Type.Literal('cancelled'),
])

const OrderItemBody = Type.Object({
  id: Type.Optional(Type.String()),
  productVariantId: Type.String(),
  productTitleSnapshot: Type.String({ minLength: 1 }),
  variantSnapshot: Type.Optional(Type.Record(Type.String(), Type.Any())),
  quantity: Type.Integer({ minimum: 1 }),
  unitPrice: Type.Number({ minimum: 0 }),
  totalPrice: Type.Optional(Type.Number({ minimum: 0 })),
  customName: Type.Optional(Type.Union([Type.String({ maxLength: 40 }), Type.Null()])),
  customNumber: Type.Optional(Type.Union([Type.String({ maxLength: 8 }), Type.Null()])),
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
  couponCode: Type.Optional(Type.Union([Type.String({ maxLength: 80 }), Type.Null()])),
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

// Guest checkout body. `userId` is omitted (auth-less endpoint), buyer is
// identified by guestEmail + shipping address. Server recomputes subtotal /
// discount / total from the items + optional coupon code — no totals trusted
// from the client.
const GuestOrderItemBody = Type.Object({
  productVariantId: Type.String(),
  quantity: Type.Integer({ minimum: 1 }),
  customName: Type.Optional(Type.Union([Type.String({ maxLength: 40 }), Type.Null()])),
  customNumber: Type.Optional(Type.Union([Type.String({ maxLength: 8 }), Type.Null()])),
})

const CreateGuestOrderBody = Type.Object({
  guestEmail: Type.Optional(Type.Union([Type.String({ maxLength: 320 }), Type.Null()])),
  couponCode: Type.Optional(Type.Union([Type.String({ maxLength: 80 }), Type.Null()])),
  // How many items the coupon should be applied to. Required when couponCode
  // is set; ignored otherwise. Server re-validates against the per-user cap.
  couponItemsApplied: Type.Optional(Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])),
  shippingAddress: AddressSchema,
  billingAddress: Type.Optional(AddressSchema),
  items: Type.Array(GuestOrderItemBody, { minItems: 1 }),
})
export type CreateGuestOrderBodyType = Static<typeof CreateGuestOrderBody>

const UpdateStatusBody = Type.Object({
  status: OrderStatusEnum,
  /**
   * Required when `status === 'cancelled'` (the server validates). Shown to
   * the customer as the shop's rejection / explanation message. Bounded at
   * 1000 chars to keep the column tidy.
   */
  rejectionReason: Type.Optional(Type.Union([Type.String({ maxLength: 1000 }), Type.Null()])),
})
export type UpdateStatusBodyType = Static<typeof UpdateStatusBody>

const UpdatePaymentBody = Type.Object({ paymentStatus: PaymentStatusEnum })
export type UpdatePaymentBodyType = Static<typeof UpdatePaymentBody>

// Optional customer-facing message shown on the cancelled order (like a reject).
const CancelOrderBody = Type.Object({
  reason: Type.Optional(Type.Union([Type.String({ maxLength: 1000 }), Type.Null()])),
})
export type CancelOrderBodyType = Static<typeof CancelOrderBody>

const UpdateAddressesBody = Type.Object({
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
})
export type UpdateAddressesBodyType = Static<typeof UpdateAddressesBody>

export const createOrderSchema: FastifySchema = { tags: ['Orders'], body: CreateOrderBody }
export const createGuestOrderSchema: FastifySchema = { tags: ['Orders'], body: CreateGuestOrderBody, description: 'Anonymous checkout. Server recomputes subtotal / discount / total from items + coupon — no totals trusted from the client.' }
export const getOrderSchema: FastifySchema = { tags: ['Orders'], params: IdParams }
export const getOrderByNumberSchema: FastifySchema = { tags: ['Orders'], params: OrderNumberParams }
export const listUserOrdersSchema: FastifySchema = { tags: ['Orders'], params: UserIdParams }
export const listOrderItemsSchema: FastifySchema = { tags: ['OrderItems'], params: IdParams }
export const placeOrderSchema: FastifySchema = { tags: ['Orders'], params: IdParams }
export const updateOrderStatusSchema: FastifySchema = { tags: ['Orders'], params: IdParams, body: UpdateStatusBody }
export const updatePaymentStatusSchema: FastifySchema = { tags: ['Orders'], params: IdParams, body: UpdatePaymentBody }
export const updateOrderAddressesSchema: FastifySchema = { tags: ['Orders'], params: IdParams, body: UpdateAddressesBody }
export const cancelOrderSchema: FastifySchema = { tags: ['Orders'], params: IdParams, body: CancelOrderBody }
export const markAdminMessageReadSchema: FastifySchema = { tags: ['Orders'], params: IdParams, description: "Customer dismisses the admin's rejection message — stamps adminMessageReadAt." }
