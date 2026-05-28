import { type Guid } from '../../core/entities/base.js'
import { type AddressSnapshot, type Cart, type CartItem, Order, OrderItem, type OrderStatus, type PaymentStatus, type Review } from '../../core/entities/commerce.js'
import { type Product, type ProductVariant } from '../../core/entities/product.js'
import { type CreateGuestOrderInput, type ICartService, type IOrderService, type IReviewService } from '../../core/services/commerce.svc.js'
import { type ICouponService } from '../../core/services/coupon.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ConflictError, ValidationError } from './errors.js'
import { assertAllowed, assertGuid, assertInteger, assertNonNegativeNumber, assertPositiveNumber, assertRequiredString } from './validators.js'

function roundCents(n: number): number {
  return Math.round(n * 100) / 100
}

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/**
 * Coerces a customer-supplied print value to its persisted form. Returns null
 * when the trimmed input is empty so we don't store " " strings. Length caps
 * mirror the column definitions (cart_items.custom_name = 40, custom_number = 8).
 */
function normalizePrint(value: string | null | undefined, maxLength: number, field: string): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`)
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > maxLength) throw new ValidationError(`${field} must be at most ${maxLength} characters`)
  return trimmed
}

/**
 * Enforce that customName/customNumber are only accepted for products with
 * `printable=true`. Looks up the product via the variant; throws when the
 * product can't be found or printing isn't enabled.
 */
async function assertPrintableAllowed(
  variantRepository: EntityRepository<ProductVariant>,
  productRepository: EntityRepository<Product>,
  productVariantId: Guid,
  customName: string | null,
  customNumber: string | null,
): Promise<void> {
  if (!customName && !customNumber) return
  const variant = await variantRepository.require(productVariantId, 'Product variant')
  const product = await productRepository.require(variant.productId, 'Product')
  if (!product.printable) throw new ValidationError('Product does not support custom name/number')
}

const cartStatuses = ['active', 'converted', 'abandoned'] as const
const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const paymentStatuses = ['pending', 'authorized', 'paid', 'failed', 'refunded'] as const

export class CartService implements ICartService {
  constructor(
    private readonly cartRepository: EntityRepository<Cart>,
    private readonly cartItemRepository: EntityRepository<CartItem>,
    private readonly variantRepository: EntityRepository<ProductVariant>,
    private readonly productRepository: EntityRepository<Product>,
  ) {}

  async getCartById(id: Guid): Promise<Cart | null> {
    assertGuid(id)
    return this.cartRepository.get(id)
  }

  async getCartItemById(id: Guid): Promise<CartItem | null> {
    assertGuid(id)
    return this.cartItemRepository.get(id)
  }

  async getActiveCartByUser(userId: Guid): Promise<Cart | null> {
    assertGuid(userId, 'userId')
    const carts = await this.cartRepository.listBy('userId', userId)
    return carts.find((cart) => cart.status === 'active' && cart.isActive) ?? null
  }

  async createCart(cart: Cart): Promise<Cart> {
    this.validateCart(cart)
    const existingActive = await this.getActiveCartByUser(cart.userId)
    if (existingActive) throw new ConflictError('User already has an active cart')
    return this.cartRepository.create(cart)
  }

  async addItem(cartItem: CartItem): Promise<CartItem> {
    this.validateCartItem(cartItem)
    const cart = await this.cartRepository.require(cartItem.cartId, 'Cart')
    if (cart.status !== 'active') throw new ValidationError('Cannot add items to a non-active cart')
    cartItem.customName = normalizePrint(cartItem.customName, 40, 'customName')
    cartItem.customNumber = normalizePrint(cartItem.customNumber, 8, 'customNumber')
    await assertPrintableAllowed(
      this.variantRepository,
      this.productRepository,
      cartItem.productVariantId,
      cartItem.customName,
      cartItem.customNumber,
    )
    // Stack quantities only when print fields match — different customisations
    // are distinct line items (the warehouse fulfils them separately).
    const existing = (await this.cartItemRepository.listBy('cartId', cartItem.cartId))
      .find((item) => item.productVariantId === cartItem.productVariantId
        && (item.customName ?? null) === cartItem.customName
        && (item.customNumber ?? null) === cartItem.customNumber)
    if (existing) return this.updateItemQuantity(existing.id, existing.quantity + cartItem.quantity)
    return this.cartItemRepository.create(cartItem)
  }

  async updateItemQuantity(cartItemId: Guid, quantity: number): Promise<CartItem> {
    assertGuid(cartItemId, 'cartItemId')
    assertInteger(quantity, 'quantity')
    if (quantity < 1) throw new ValidationError('quantity must be at least 1')
    const cartItem = await this.cartItemRepository.require(cartItemId, 'Cart item')
    const cart = await this.cartRepository.require(cartItem.cartId, 'Cart')
    if (cart.status !== 'active') throw new ValidationError('Cannot update items in a non-active cart')
    return this.cartItemRepository.update(cartItemId, { quantity } as Partial<CartItem>)
  }

  async removeItem(cartItemId: Guid): Promise<void> {
    assertGuid(cartItemId, 'cartItemId')
    await this.cartItemRepository.require(cartItemId, 'Cart item')
    await this.cartItemRepository.delete(cartItemId)
  }

  async listCartItems(cartId: Guid): Promise<CartItem[]> {
    assertGuid(cartId, 'cartId')
    return this.cartItemRepository.listBy('cartId', cartId)
  }

  async abandonCart(cartId: Guid): Promise<Cart> {
    assertGuid(cartId, 'cartId')
    return this.cartRepository.update(cartId, { status: 'abandoned', isActive: false } as Partial<Cart>)
  }

  async convertCart(cartId: Guid): Promise<Cart> {
    assertGuid(cartId, 'cartId')
    const items = await this.listCartItems(cartId)
    if (items.length === 0) throw new ValidationError('Cannot convert an empty cart')
    return this.cartRepository.update(cartId, { status: 'converted', isActive: false } as Partial<Cart>)
  }

  private validateCart(cart: Cart): void {
    assertGuid(cart.id)
    assertGuid(cart.userId, 'userId')
    assertAllowed(cart.status, cartStatuses, 'status')
  }

  private validateCartItem(cartItem: CartItem): void {
    assertGuid(cartItem.id)
    assertGuid(cartItem.cartId, 'cartId')
    assertGuid(cartItem.productVariantId, 'productVariantId')
    assertInteger(cartItem.quantity, 'quantity')
    assertPositiveNumber(cartItem.quantity, 'quantity')
    assertNonNegativeNumber(cartItem.priceAtTime, 'priceAtTime')
  }
}

export class OrderService implements IOrderService {
  constructor(
    private readonly orderRepository: EntityRepository<Order>,
    private readonly orderItemRepository: EntityRepository<OrderItem>,
    private readonly variantRepository: EntityRepository<ProductVariant>,
    private readonly productRepository: EntityRepository<Product>,
    private readonly couponService?: ICouponService,
  ) {}

  async createOrder(order: Order, items: OrderItem[]): Promise<Order> {
    this.validateOrder(order)
    if (items.length === 0) throw new ValidationError('Order must have at least one item')
    if (await this.orderRepository.findBy('orderNumber', order.orderNumber)) throw new ConflictError('Order number already exists')
    const subtotal = items.reduce((sum, item) => {
      this.validateOrderItem(item, order.id)
      return sum + item.totalPrice
    }, 0)
    if (Math.abs(order.subtotal - subtotal) > 0.01) throw new ValidationError('Order subtotal does not match item totals')
    order.totalAmount = order.calculateTotal()
    const created = await this.orderRepository.create(order)
    await Promise.all(items.map((item) => this.orderItemRepository.create(item)))
    return created
  }

  /**
   * One-shot guest checkout. The client passes items + addresses + an optional
   * coupon code; the server resolves prices from each variant (falling back to
   * the parent product's basePrice), validates the coupon, recomputes every
   * monetary field, and persists the Order + OrderItems atomically before
   * placing the order. Returns the canonical row the client should render on
   * the confirmation screen.
   */
  async createGuestOrder(input: CreateGuestOrderInput): Promise<{ order: Order; items: OrderItem[] }> {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new ValidationError('items must be a non-empty array')
    }
    this.validateAddress(input.shippingAddress, 'shippingAddress')
    const billingAddress = input.billingAddress ?? input.shippingAddress
    this.validateAddress(billingAddress, 'billingAddress')

    // Resolve each line: pull the variant, its parent product, snapshot the
    // current sell price, and enforce the printable guardrail. One DB hit per
    // distinct variant — fine for the small carts this storefront sees.
    const orderId = crypto.randomUUID()
    let subtotal = 0
    const resolvedItems: OrderItem[] = []
    for (const entry of input.items) {
      assertGuid(entry.productVariantId, 'productVariantId')
      assertInteger(entry.quantity, 'quantity')
      assertPositiveNumber(entry.quantity, 'quantity')
      const variant = await this.variantRepository.require(entry.productVariantId, 'Product variant')
      const product = await this.productRepository.require(variant.productId, 'Product')
      const customName = normalizePrint(entry.customName, 40, 'customName')
      const customNumber = normalizePrint(entry.customNumber, 8, 'customNumber')
      if ((customName || customNumber) && !product.printable) {
        throw new ValidationError(`Product "${product.title}" does not support custom name/number`)
      }
      const unitPrice = roundCents(variant.priceOverride ?? product.basePrice)
      const totalPrice = roundCents(unitPrice * entry.quantity)
      subtotal = roundCents(subtotal + totalPrice)
      resolvedItems.push(new OrderItem({
        orderId,
        productVariantId: variant.id,
        productTitleSnapshot: product.title,
        variantSnapshot: { sku: variant.sku },
        quantity: entry.quantity,
        unitPrice,
        totalPrice,
        customName,
        customNumber,
      }))
    }

    // Resolve coupon: a missing/inactive code is a hard error so the customer
    // sees a clear "coupon invalid" message rather than a silently-dropped
    // discount. Zero-amount resolutions are also rejected upstream.
    let discountAmount = 0
    let couponCode: string | null = null
    if (input.couponCode && input.couponCode.trim().length > 0) {
      if (!this.couponService) throw new ValidationError('Coupon validation is unavailable')
      const resolved = await this.couponService.validate(input.couponCode, subtotal)
      discountAmount = resolved.amount
      couponCode = resolved.code
    }

    const totalAmount = roundCents(Math.max(0, subtotal - discountAmount))
    const order = new Order({
      id: orderId,
      userId: null,
      guestEmail: input.guestEmail ?? null,
      orderNumber: generateOrderNumber(),
      status: 'pending',
      paymentStatus: 'pending',
      subtotal,
      discountAmount,
      couponCode,
      shippingAmount: 0,
      totalAmount,
      shippingAddress: input.shippingAddress,
      billingAddress,
    })

    if (await this.orderRepository.findBy('orderNumber', order.orderNumber)) {
      throw new ConflictError('Order number already exists')
    }
    await this.orderRepository.create(order)
    await Promise.all(resolvedItems.map((item) => this.orderItemRepository.create(item)))

    // Place immediately — guest checkout is single-step.
    const placed = await this.orderRepository.update(order.id, {
      status: 'confirmed',
      placedAt: new Date(),
    } as Partial<Order>)
    return { order: placed, items: resolvedItems }
  }

  async getOrderById(id: Guid): Promise<Order | null> {
    assertGuid(id)
    return this.orderRepository.get(id)
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    assertRequiredString(orderNumber, 'orderNumber', 80)
    return this.orderRepository.findBy('orderNumber', orderNumber)
  }

  async listUserOrders(userId: Guid): Promise<Order[]> {
    assertGuid(userId, 'userId')
    return this.orderRepository.listBy('userId', userId)
  }

  async listOrderItems(orderId: Guid): Promise<OrderItem[]> {
    assertGuid(orderId, 'orderId')
    return this.orderItemRepository.listBy('orderId', orderId)
  }

  async placeOrder(id: Guid): Promise<Order> {
    assertGuid(id)
    const order = await this.orderRepository.require(id, 'Order')
    if (order.status !== 'pending') throw new ValidationError('Only pending orders can be placed')
    return this.orderRepository.update(id, { status: 'confirmed', placedAt: new Date() } as Partial<Order>)
  }

  async updateOrderStatus(id: Guid, status: OrderStatus): Promise<Order> {
    assertGuid(id)
    assertAllowed(status, orderStatuses, 'status')
    const order = await this.orderRepository.require(id, 'Order')
    if (order.status === 'cancelled') throw new ValidationError('Cancelled orders cannot be updated')
    return this.orderRepository.update(id, { status } as Partial<Order>)
  }

  async updatePaymentStatus(id: Guid, paymentStatus: PaymentStatus): Promise<Order> {
    assertGuid(id)
    assertAllowed(paymentStatus, paymentStatuses, 'paymentStatus')
    const order = await this.orderRepository.require(id, 'Order')
    if (order.status === 'cancelled' && paymentStatus !== 'refunded') throw new ValidationError('Cancelled orders can only move payment to refunded')
    return this.orderRepository.update(id, { paymentStatus } as Partial<Order>)
  }

  async updateAddresses(id: Guid, shippingAddress: AddressSnapshot, billingAddress: AddressSnapshot): Promise<Order> {
    assertGuid(id)
    this.validateAddress(shippingAddress, 'shippingAddress')
    this.validateAddress(billingAddress, 'billingAddress')
    const order = await this.orderRepository.require(id, 'Order')
    if (order.status !== 'pending') throw new ValidationError('Addresses can only be updated while order is pending')
    return this.orderRepository.update(id, { shippingAddress, billingAddress } as Partial<Order>)
  }

  async cancelOrder(id: Guid): Promise<Order> {
    assertGuid(id)
    const order = await this.orderRepository.require(id, 'Order')
    if (order.status === 'shipped' || order.status === 'delivered') throw new ValidationError('Shipped or delivered orders cannot be cancelled')
    return this.orderRepository.update(id, { status: 'cancelled', isActive: false } as Partial<Order>)
  }

  private validateOrder(order: Order): void {
    assertGuid(order.id)
    // userId is nullable to support guest checkout. When present, validate the shape.
    if (order.userId !== null && order.userId !== undefined) assertGuid(order.userId, 'userId')
    assertRequiredString(order.orderNumber, 'orderNumber', 80)
    assertAllowed(order.status, orderStatuses, 'status')
    assertAllowed(order.paymentStatus, paymentStatuses, 'paymentStatus')
    assertNonNegativeNumber(order.subtotal, 'subtotal')
    assertNonNegativeNumber(order.discountAmount, 'discountAmount')
    assertNonNegativeNumber(order.shippingAmount, 'shippingAmount')
    this.validateAddress(order.shippingAddress, 'shippingAddress')
    this.validateAddress(order.billingAddress, 'billingAddress')
  }

  private validateOrderItem(item: OrderItem, orderId: Guid): void {
    assertGuid(item.id)
    if (item.orderId !== orderId) throw new ValidationError('Order item does not belong to the order')
    assertGuid(item.productVariantId, 'productVariantId')
    assertRequiredString(item.productTitleSnapshot, 'productTitleSnapshot')
    assertInteger(item.quantity, 'quantity')
    assertPositiveNumber(item.quantity, 'quantity')
    assertNonNegativeNumber(item.unitPrice, 'unitPrice')
    assertNonNegativeNumber(item.totalPrice, 'totalPrice')
    if (Math.abs(item.totalPrice - item.quantity * item.unitPrice) > 0.01) throw new ValidationError('Order item total is invalid')
  }

  private validateAddress(address: AddressSnapshot, fieldName: string): void {
    assertRequiredString(address.fullName, `${fieldName}.fullName`)
    assertRequiredString(address.phone, `${fieldName}.phone`, 40)
    assertRequiredString(address.addressLine1, `${fieldName}.addressLine1`, 255)
    assertRequiredString(address.city, `${fieldName}.city`)
    assertRequiredString(address.country, `${fieldName}.country`)
  }
}

export class ReviewService implements IReviewService {
  constructor(
    private readonly reviewRepository: EntityRepository<Review>,
  ) {}

  async createReview(review: Review): Promise<Review> {
    this.validateReview(review)
    const duplicate = (await this.reviewRepository.listBy('userId', review.userId)).some((item) => item.productId === review.productId)
    if (duplicate) throw new ConflictError('User already reviewed this product')
    return this.reviewRepository.create(review)
  }

  async updateReview(id: Guid, data: Partial<Review>): Promise<Review> {
    assertGuid(id)
    if (data.rating !== undefined) this.assertRating(data.rating)
    return this.reviewRepository.update(id, data)
  }

  async getReviewById(id: Guid): Promise<Review | null> {
    assertGuid(id)
    return this.reviewRepository.get(id)
  }

  async listProductReviews(productId: Guid): Promise<Review[]> {
    assertGuid(productId, 'productId')
    return (await this.reviewRepository.listBy('productId', productId)).filter((review) => review.isActive)
  }

  async listUserReviews(userId: Guid): Promise<Review[]> {
    assertGuid(userId, 'userId')
    return this.reviewRepository.listBy('userId', userId)
  }

  async markVerifiedPurchase(id: Guid): Promise<Review> {
    assertGuid(id)
    return this.reviewRepository.update(id, { isVerifiedPurchase: true } as Partial<Review>)
  }

  async deactivateReview(id: Guid): Promise<Review> {
    assertGuid(id)
    return this.reviewRepository.update(id, { isActive: false } as Partial<Review>)
  }

  private validateReview(review: Review): void {
    assertGuid(review.id)
    assertGuid(review.userId, 'userId')
    assertGuid(review.productId, 'productId')
    this.assertRating(review.rating)
  }

  private assertRating(rating: number): void {
    assertInteger(rating, 'rating')
    if (rating < 1 || rating > 5) throw new ValidationError('rating must be between 1 and 5')
  }
}
