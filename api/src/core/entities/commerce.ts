import { BaseEntity, type BusinessEntity, type BusinessEntityPayload, type Guid } from './base.js'

export type CartStatus = 'active' | 'converted' | 'abandoned'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded'

export interface AddressSnapshot {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state?: string | null
  country: string
  postalCode?: string | null
}

export interface CartEntity extends BusinessEntity {
  userId: Guid
  status: CartStatus
}

export interface CartItemEntity extends BusinessEntity {
  cartId: Guid
  productVariantId: Guid
  quantity: number
  priceAtTime: number
  /** Customer-supplied printing fields — only valid when the product has `printable=true`. */
  customName?: string | null
  customNumber?: string | null
}

export interface OrderEntity extends BusinessEntity {
  /** Nullable for guest checkout; when null, the buyer is identified by guestEmail + shipping address. */
  userId: Guid | null
  guestEmail?: string | null
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discountAmount: number
  /** Coupon code denormalized from the ui-content coupon slot at submit time. */
  couponCode?: string | null
  /** How many items the coupon applied to on this order. 0 when no coupon was used. Drives the per-user item cap. */
  couponItemsApplied?: number
  shippingAmount: number
  totalAmount: number
  shippingAddress: AddressSnapshot
  billingAddress: AddressSnapshot
  placedAt?: Date | null
  /** Required when status transitions to `cancelled`; shown to the customer as the shop's explanation. */
  rejectionReason?: string | null
  /** When the customer last viewed the rejection message. Null = unread (drives the envelope badge). */
  adminMessageReadAt?: Date | null
}

export interface OrderItemEntity extends BusinessEntity {
  orderId: Guid
  productVariantId: Guid
  productTitleSnapshot: string
  variantSnapshot: Record<string, unknown>
  quantity: number
  unitPrice: number
  totalPrice: number
  /** Snapshotted printing fields — copied from the cart item at order time. */
  customName?: string | null
  customNumber?: string | null
}

export interface ReviewEntity extends BusinessEntity {
  userId: Guid
  productId: Guid
  rating: number
  title?: string | null
  comment?: string | null
  isVerifiedPurchase: boolean
}

export type CartPayload = BusinessEntityPayload & Omit<CartEntity, keyof BusinessEntity | 'status'> & { status?: CartStatus }
export type CartItemPayload = BusinessEntityPayload & Omit<CartItemEntity, keyof BusinessEntity>
export type OrderPayload = BusinessEntityPayload & Omit<OrderEntity, keyof BusinessEntity | 'status' | 'paymentStatus' | 'discountAmount' | 'shippingAmount' | 'totalAmount' | 'rejectionReason' | 'adminMessageReadAt' | 'couponItemsApplied'> & {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  discountAmount?: number
  shippingAmount?: number
  totalAmount?: number
  rejectionReason?: string | null
  adminMessageReadAt?: Date | null
  couponItemsApplied?: number
}
export type OrderItemPayload = BusinessEntityPayload & Omit<OrderItemEntity, keyof BusinessEntity | 'totalPrice'> & { totalPrice?: number }
export type ReviewPayload = BusinessEntityPayload & Omit<ReviewEntity, keyof BusinessEntity | 'isVerifiedPurchase'> & { isVerifiedPurchase?: boolean }

export class Cart extends BaseEntity implements CartEntity {
  userId: Guid
  status: CartStatus

  constructor(payload: CartPayload) {
    super(payload)
    this.userId = payload.userId
    this.status = payload.status ?? 'active'
  }

  convert(): void {
    this.status = 'converted'
    this.deactivate()
  }

  abandon(): void {
    this.status = 'abandoned'
    this.deactivate()
  }
}

export class CartItem extends BaseEntity implements CartItemEntity {
  cartId: Guid
  productVariantId: Guid
  quantity: number
  priceAtTime: number
  customName?: string | null
  customNumber?: string | null

  constructor(payload: CartItemPayload) {
    super(payload)
    this.cartId = payload.cartId
    this.productVariantId = payload.productVariantId
    this.quantity = payload.quantity
    this.priceAtTime = payload.priceAtTime
    this.customName = payload.customName ?? null
    this.customNumber = payload.customNumber ?? null
  }

  updateQuantity(quantity: number): void {
    if (quantity < 1) throw new Error('Quantity must be at least 1')
    this.quantity = quantity
    this.touch()
  }
}

export class Order extends BaseEntity implements OrderEntity {
  userId: Guid | null
  guestEmail?: string | null
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discountAmount: number
  couponCode?: string | null
  couponItemsApplied: number
  shippingAmount: number
  totalAmount: number
  shippingAddress: AddressSnapshot
  billingAddress: AddressSnapshot
  placedAt?: Date | null
  rejectionReason?: string | null
  adminMessageReadAt?: Date | null

  constructor(payload: OrderPayload) {
    super(payload)
    this.userId = payload.userId ?? null
    this.guestEmail = payload.guestEmail ?? null
    this.orderNumber = payload.orderNumber
    this.status = payload.status ?? 'pending'
    this.paymentStatus = payload.paymentStatus ?? 'pending'
    this.subtotal = payload.subtotal
    this.discountAmount = payload.discountAmount ?? 0
    this.couponCode = payload.couponCode ?? null
    this.couponItemsApplied = payload.couponItemsApplied ?? 0
    this.shippingAmount = payload.shippingAmount ?? 0
    this.totalAmount = payload.totalAmount ?? this.calculateTotal()
    this.shippingAddress = payload.shippingAddress
    this.billingAddress = payload.billingAddress
    this.placedAt = payload.placedAt
    this.rejectionReason = payload.rejectionReason ?? null
    this.adminMessageReadAt = payload.adminMessageReadAt ?? null
  }

  calculateTotal(): number {
    return this.subtotal - this.discountAmount + this.shippingAmount
  }

  place(date = new Date()): void {
    this.placedAt = date
    this.status = 'confirmed'
    this.touch(date)
  }

  markPaid(): void {
    this.paymentStatus = 'paid'
    this.touch()
  }

  /**
   * Cancel the order with a customer-facing explanation. The reason becomes
   * the message rendered on the customer's order detail page.
   */
  cancel(reason: string): void {
    this.status = 'cancelled'
    this.rejectionReason = reason
    // Force the message back to "unread" so the customer is re-notified even
    // if they previously dismissed an older rejection on the same order.
    this.adminMessageReadAt = null
    this.deactivate()
  }

  markMessageRead(date = new Date()): void {
    this.adminMessageReadAt = date
    this.touch(date)
  }
}

export class OrderItem extends BaseEntity implements OrderItemEntity {
  orderId: Guid
  productVariantId: Guid
  productTitleSnapshot: string
  variantSnapshot: Record<string, unknown>
  quantity: number
  unitPrice: number
  totalPrice: number
  customName?: string | null
  customNumber?: string | null

  constructor(payload: OrderItemPayload) {
    super(payload)
    this.orderId = payload.orderId
    this.productVariantId = payload.productVariantId
    this.productTitleSnapshot = payload.productTitleSnapshot
    this.variantSnapshot = payload.variantSnapshot
    this.quantity = payload.quantity
    this.unitPrice = payload.unitPrice
    this.totalPrice = payload.totalPrice ?? payload.quantity * payload.unitPrice
    this.customName = payload.customName ?? null
    this.customNumber = payload.customNumber ?? null
  }
}

export class Review extends BaseEntity implements ReviewEntity {
  userId: Guid
  productId: Guid
  rating: number
  title?: string | null
  comment?: string | null
  isVerifiedPurchase: boolean

  constructor(payload: ReviewPayload) {
    super(payload)
    if (payload.rating < 1 || payload.rating > 5) throw new Error('Rating must be between 1 and 5')
    this.userId = payload.userId
    this.productId = payload.productId
    this.rating = payload.rating
    this.title = payload.title
    this.comment = payload.comment
    this.isVerifiedPurchase = payload.isVerifiedPurchase ?? false
  }
}
