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
}

export interface OrderEntity extends BusinessEntity {
  userId: Guid
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discountAmount: number
  shippingAmount: number
  totalAmount: number
  shippingAddress: AddressSnapshot
  billingAddress: AddressSnapshot
  placedAt?: Date | null
}

export interface OrderItemEntity extends BusinessEntity {
  orderId: Guid
  productVariantId: Guid
  productTitleSnapshot: string
  variantSnapshot: Record<string, unknown>
  quantity: number
  unitPrice: number
  totalPrice: number
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
export type OrderPayload = BusinessEntityPayload & Omit<OrderEntity, keyof BusinessEntity | 'status' | 'paymentStatus' | 'discountAmount' | 'shippingAmount' | 'totalAmount'> & {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  discountAmount?: number
  shippingAmount?: number
  totalAmount?: number
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

  constructor(payload: CartItemPayload) {
    super(payload)
    this.cartId = payload.cartId
    this.productVariantId = payload.productVariantId
    this.quantity = payload.quantity
    this.priceAtTime = payload.priceAtTime
  }

  updateQuantity(quantity: number): void {
    if (quantity < 1) throw new Error('Quantity must be at least 1')
    this.quantity = quantity
    this.touch()
  }
}

export class Order extends BaseEntity implements OrderEntity {
  userId: Guid
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discountAmount: number
  shippingAmount: number
  totalAmount: number
  shippingAddress: AddressSnapshot
  billingAddress: AddressSnapshot
  placedAt?: Date | null

  constructor(payload: OrderPayload) {
    super(payload)
    this.userId = payload.userId
    this.orderNumber = payload.orderNumber
    this.status = payload.status ?? 'pending'
    this.paymentStatus = payload.paymentStatus ?? 'pending'
    this.subtotal = payload.subtotal
    this.discountAmount = payload.discountAmount ?? 0
    this.shippingAmount = payload.shippingAmount ?? 0
    this.totalAmount = payload.totalAmount ?? this.calculateTotal()
    this.shippingAddress = payload.shippingAddress
    this.billingAddress = payload.billingAddress
    this.placedAt = payload.placedAt
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

  cancel(): void {
    this.status = 'cancelled'
    this.deactivate()
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

  constructor(payload: OrderItemPayload) {
    super(payload)
    this.orderId = payload.orderId
    this.productVariantId = payload.productVariantId
    this.productTitleSnapshot = payload.productTitleSnapshot
    this.variantSnapshot = payload.variantSnapshot
    this.quantity = payload.quantity
    this.unitPrice = payload.unitPrice
    this.totalPrice = payload.totalPrice ?? payload.quantity * payload.unitPrice
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
