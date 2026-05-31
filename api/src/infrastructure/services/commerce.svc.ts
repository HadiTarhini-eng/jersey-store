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

/**
 * The order-status workflow the admin walks an order through. Strict — the
 * admin cannot jump steps. Cancellation is allowed from any non-terminal
 * state and always requires a rejection reason.
 *
 *   pending    ──▶ processing | cancelled        ("Confirm order" / "Reject")
 *   processing ──▶ shipped    | cancelled        ("Mark on route" / "Reject")
 *   shipped    ──▶ delivered                     ("Mark delivered")
 *   delivered  ──▶ (terminal)
 *   cancelled  ──▶ (terminal)
 *
 *   confirmed  ──▶ processing | shipped | cancelled  (legacy fallback only)
 *
 * `confirmed` stays in the enum so existing rows don't break, but it is no
 * longer reachable through new transitions — admins now confirm-and-start
 * processing in one step.
 *
 * `shipped` is rendered as "On route" on the customer-facing UI but kept as
 * `shipped` on the wire so older orders don't need migration.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
  confirmed:  ['processing', 'shipped', 'cancelled'],
}

const MAX_REJECTION_REASON_LENGTH = 1000

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
    //
    // We also sum the requested quantity per variant so we can validate that
    // total demand (across multiple cart lines for the same SKU + different
    // print options) doesn't exceed available stock.
    const orderId = crypto.randomUUID()
    let subtotal = 0
    const resolvedItems: OrderItem[] = []
    const demandByVariant = new Map<Guid, number>()
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
      const totalForVariant = (demandByVariant.get(variant.id) ?? 0) + entry.quantity
      if (totalForVariant > variant.stockQuantity) {
        throw new ValidationError(
          `Insufficient stock for "${product.title}" (${variant.sku}): requested ${totalForVariant}, available ${variant.stockQuantity}`,
        )
      }
      demandByVariant.set(variant.id, totalForVariant)
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
    // discount. Zero-amount resolutions are also rejected upstream. We
    // re-validate with the caller's identity (when present) so the per-user
    // item cap is enforced server-side — the client toast was advisory only.
    let discountAmount = 0
    let couponCode: string | null = null
    let couponItemsApplied = 0
    if (input.couponCode && input.couponCode.trim().length > 0) {
      if (!this.couponService) throw new ValidationError('Coupon validation is unavailable')
      const totalItems = resolvedItems.reduce((sum, item) => sum + item.quantity, 0)
      const requestedItems = input.couponItemsApplied ?? totalItems
      if (!Number.isInteger(requestedItems) || requestedItems < 1) {
        throw new ValidationError('couponItemsApplied must be a positive integer when applying a coupon')
      }
      if (requestedItems > totalItems) {
        throw new ValidationError(`Cannot apply coupon to ${requestedItems} items — cart only has ${totalItems}`)
      }
      const resolved = await this.couponService.validate(
        input.couponCode,
        subtotal,
        requestedItems,
        totalItems,
        input.userId ?? null,
      )
      discountAmount = resolved.amount
      couponCode = resolved.code
      couponItemsApplied = resolved.itemsApplied
    }

    const totalAmount = roundCents(Math.max(0, subtotal - discountAmount))
    const order = new Order({
      id: orderId,
      // If the caller was authenticated, attribute the order to them.
      // Guest carts still post here with userId omitted/null.
      userId: input.userId ?? null,
      guestEmail: input.guestEmail ?? null,
      orderNumber: generateOrderNumber(),
      status: 'pending',
      paymentStatus: 'pending',
      subtotal,
      discountAmount,
      couponCode,
      couponItemsApplied,
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

    // Deduct stock immediately at checkout so concurrent shoppers see the
    // accurate available count and can't double-claim the same units. The
    // stock is restored if the admin later cancels the order — see
    // `updateOrderStatus` / `cancelOrder`.
    await this.adjustStockForOrder(order.id, 'deduct')

    // New orders enter the admin workflow at `pending`. The admin's "Confirm
    // order" action is what moves them forward to `processing`; previously this
    // step auto-bumped to `confirmed`, which short-circuited the workflow.
    // `placedAt` is still stamped at creation so timestamps are meaningful.
    const placed = await this.orderRepository.update(order.id, {
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

  async updateOrderStatus(id: Guid, status: OrderStatus, rejectionReason?: string | null): Promise<Order> {
    assertGuid(id)
    assertAllowed(status, orderStatuses, 'status')
    const order = await this.orderRepository.require(id, 'Order')

    // Strict workflow — see ALLOWED_TRANSITIONS for the graph.
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? []
    if (status !== order.status && !allowed.includes(status)) {
      throw new ValidationError(`Order cannot transition from ${order.status} to ${status}`)
    }

    // Cancellation always needs a customer-facing reason. Anything else must
    // NOT carry a reason — keeps the data model tight.
    const patch: Partial<Order> = { status }
    if (status === 'cancelled') {
      const trimmed = (rejectionReason ?? '').trim()
      if (trimmed.length === 0) {
        throw new ValidationError('rejectionReason is required when cancelling an order')
      }
      if (trimmed.length > MAX_REJECTION_REASON_LENGTH) {
        throw new ValidationError(`rejectionReason must be ${MAX_REJECTION_REASON_LENGTH} characters or fewer`)
      }
      patch.rejectionReason = trimmed
      // Force the message to "unread" so the customer is re-notified.
      patch.adminMessageReadAt = null
    }

    // ── Stock adjustments tied to the workflow ────────────────────────────
    //
    // Stock is deducted at checkout (see `createGuestOrder`) so concurrent
    // shoppers see accurate availability. The only workflow-driven stock
    // change is the restore that happens when the admin cancels an order
    // that hadn't already been cancelled — that releases the held units
    // back to the catalog.
    const moving = status !== order.status
    if (moving && status === 'cancelled' && order.status !== 'cancelled') {
      await this.adjustStockForOrder(id, 'restore')
    }

    return this.orderRepository.update(id, patch)
  }

  /**
   * Adjust on-hand stock for every line in an order. `deduct` subtracts the
   * ordered quantity from each variant; `restore` adds it back. Best-effort
   * per line — a single broken variant won't bomb the rest of the order.
   */
  private async adjustStockForOrder(orderId: Guid, direction: 'deduct' | 'restore'): Promise<void> {
    const items = await this.orderItemRepository.listBy('orderId', orderId)
    for (const item of items) {
      try {
        const variant = await this.variantRepository.findBy('id', item.productVariantId)
        if (!variant) continue
        const delta = direction === 'deduct' ? -item.quantity : item.quantity
        const next = Math.max(0, variant.stockQuantity + delta)
        await this.variantRepository.update(variant.id, { stockQuantity: next } as Partial<ProductVariant>)
      } catch (err) {
        console.warn(`Stock ${direction} failed for variant ${item.productVariantId}:`, err)
      }
    }
  }

  async markAdminMessageRead(id: Guid): Promise<Order> {
    assertGuid(id)
    const order = await this.orderRepository.require(id, 'Order')
    // No-op when there's nothing to read — but still return the row so the
    // client doesn't 404 on benign double-clicks.
    if (!order.rejectionReason || order.adminMessageReadAt) return order
    return this.orderRepository.update(id, { adminMessageReadAt: new Date() } as Partial<Order>)
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
    // Already-cancelled orders had their stock restored on the first cancel —
    // don't double-restore.
    if (order.status !== 'cancelled') {
      await this.adjustStockForOrder(id, 'restore')
    }
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
