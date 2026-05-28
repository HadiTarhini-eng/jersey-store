import { type Guid } from '../entities/base.js'
import { type AddressSnapshot, type Cart, type CartItem, type Order, type OrderItem, type OrderStatus, type PaymentStatus, type Review } from '../entities/commerce.js'

export interface GuestOrderItemInput {
  productVariantId: Guid
  quantity: number
  customName?: string | null
  customNumber?: string | null
}

export interface CreateGuestOrderInput {
  guestEmail?: string | null
  couponCode?: string | null
  shippingAddress: AddressSnapshot
  billingAddress?: AddressSnapshot
  items: GuestOrderItemInput[]
}

export interface ICartService {
  getCartById: (id: Guid) => Promise<Cart | null>
  getCartItemById: (id: Guid) => Promise<CartItem | null>
  getActiveCartByUser: (userId: Guid) => Promise<Cart | null>
  createCart: (cart: Cart) => Promise<Cart>
  addItem: (cartItem: CartItem) => Promise<CartItem>
  updateItemQuantity: (cartItemId: Guid, quantity: number) => Promise<CartItem>
  removeItem: (cartItemId: Guid) => Promise<void>
  listCartItems: (cartId: Guid) => Promise<CartItem[]>
  abandonCart: (cartId: Guid) => Promise<Cart>
  convertCart: (cartId: Guid) => Promise<Cart>
}

export interface IOrderService {
  createOrder: (order: Order, items: OrderItem[]) => Promise<Order>
  /**
   * Atomic guest checkout: server resolves prices from product variants,
   * validates the optional coupon, recomputes subtotal / discount / total,
   * snapshots an Order + OrderItems, and immediately places the order. All
   * monetary inputs from the client are ignored — only items + addresses +
   * couponCode are honored.
   */
  createGuestOrder: (input: CreateGuestOrderInput) => Promise<{ order: Order; items: OrderItem[] }>
  getOrderById: (id: Guid) => Promise<Order | null>
  getOrderByNumber: (orderNumber: string) => Promise<Order | null>
  listUserOrders: (userId: Guid) => Promise<Order[]>
  listOrderItems: (orderId: Guid) => Promise<OrderItem[]>
  placeOrder: (id: Guid) => Promise<Order>
  updateOrderStatus: (id: Guid, status: OrderStatus) => Promise<Order>
  updatePaymentStatus: (id: Guid, paymentStatus: PaymentStatus) => Promise<Order>
  updateAddresses: (id: Guid, shippingAddress: AddressSnapshot, billingAddress: AddressSnapshot) => Promise<Order>
  cancelOrder: (id: Guid) => Promise<Order>
}

export interface IReviewService {
  createReview: (review: Review) => Promise<Review>
  updateReview: (id: Guid, data: Partial<Review>) => Promise<Review>
  getReviewById: (id: Guid) => Promise<Review | null>
  listProductReviews: (productId: Guid) => Promise<Review[]>
  listUserReviews: (userId: Guid) => Promise<Review[]>
  markVerifiedPurchase: (id: Guid) => Promise<Review>
  deactivateReview: (id: Guid) => Promise<Review>
}
