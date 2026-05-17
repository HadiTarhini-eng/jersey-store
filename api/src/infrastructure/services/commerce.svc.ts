import { type Guid } from '../../core/entities/base.js'
import { type AddressSnapshot, type Cart, type CartItem, type Order, type OrderItem, type OrderStatus, type PaymentStatus, type Review } from '../../core/entities/commerce.js'
import { type ICartService, type IOrderService, type IReviewService } from '../../core/services/commerce.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ConflictError, ValidationError } from './errors.js'
import { assertAllowed, assertGuid, assertInteger, assertNonNegativeNumber, assertPositiveNumber, assertRequiredString } from './validators.js'

const cartStatuses = ['active', 'converted', 'abandoned'] as const
const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const paymentStatuses = ['pending', 'authorized', 'paid', 'failed', 'refunded'] as const

export class CartService implements ICartService {
  constructor(
    private readonly cartRepository: EntityRepository<Cart>,
    private readonly cartItemRepository: EntityRepository<CartItem>,
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
    const existing = (await this.cartItemRepository.listBy('cartId', cartItem.cartId)).find((item) => item.productVariantId === cartItem.productVariantId)
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
    assertGuid(order.userId, 'userId')
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
