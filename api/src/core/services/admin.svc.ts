import { type AddressSnapshot, type OrderStatus, type PaymentStatus } from '../entities/commerce.js'
import { type Guid } from '../entities/base.js'

/**
 * Aggregated admin view-models. These exist to collapse the N+1 fetch storms
 * the admin UI used to produce (user list → per-user orders → per-order items)
 * into single joined queries on the server.
 */

export interface AdminCustomerSummary {
  id:           Guid
  firstName:    string
  lastName:     string
  email:        string
  phone:        string | null
  country:      string | null
  ordersCount:  number
  totalSpent:   number
  joinedAt:     Date
  isActive:     boolean
}

export interface AdminOrderItemSummary {
  productVariantId:     Guid
  productTitleSnapshot: string
  size:                 string
  quantity:             number
  unitPrice:            number
  totalPrice:           number
}

export interface AdminOrderSummary {
  id:               Guid
  orderNumber:      string
  /**
   * For authenticated orders, `id` is the user's GUID and all fields are
   * populated. For guest orders (placed via /orders/guest without a JWT),
   * `id` is null and the name/email come from the shipping snapshot or
   * `guestEmail` if the customer supplied one — clients should render a
   * "Guest" label and skip any user-detail links.
   */
  customer:         { id: Guid | null; firstName: string; lastName: string; email: string | null }
  itemsCount:       number
  items:            AdminOrderItemSummary[]
  subtotal:         number
  shippingAmount:   number
  totalAmount:      number
  status:           OrderStatus
  paymentStatus:    PaymentStatus
  shippingAddress:  AddressSnapshot
  billingAddress:   AddressSnapshot
  createdAt:        Date
  placedAt:         Date | null
  /** Admin's rejection / explanation message — only set when status is `cancelled`. */
  rejectionReason:    string | null
  /** When the customer last viewed the rejection message. Null = unread. */
  adminMessageReadAt: Date | null
}

/**
 * Aggregate snapshot for the admin Revenue page. Revenue is recognised on
 * delivered orders only — orders sitting in processing/shipped don't count
 * until the customer has the goods.
 */
export interface AdminRevenueSummary {
  /** Sum of `totalAmount` across delivered orders. */
  totalRevenue:    number
  /** Sum of `discountAmount` across delivered orders (informational). */
  totalDiscounts:  number
  /** Count of delivered orders. */
  deliveredCount:  number
  /** Count of orders that didn't get to delivered (pending + processing + shipped). */
  inFlightCount:   number
  /** Count of orders that got cancelled. */
  cancelledCount:  number
  /** Average revenue per delivered order. */
  averageOrderValue: number
  /**
   * Revenue tied up in orders that have been confirmed but not yet delivered —
   * the admin's "pipeline" view of money that will be recognised on delivery.
   */
  pendingRevenue:    number
  /**
   * Delivered ÷ (delivered + cancelled). The share of placed orders that
   * actually completed. Useful as a rough fulfillment-quality signal.
   */
  conversionRate:    number
  /** Revenue earned in the trailing 30-day window (delivered orders only). */
  last30dRevenue:    number
  /** Revenue earned in the 30-day window before that — for trend comparison. */
  previous30dRevenue: number
  /** Top-line totals broken down month-by-month, newest first. */
  byMonth:         { month: string; revenue: number; orders: number }[]
  /** Best-selling products by revenue across delivered orders. */
  topProducts:     { productVariantId: string; title: string; quantity: number; revenue: number }[]
}

export interface IAdminService {
  listCustomers: () => Promise<AdminCustomerSummary[]>
  listOrders:    () => Promise<AdminOrderSummary[]>
  getOrder:      (id: Guid) => Promise<AdminOrderSummary | null>
  revenueSummary: () => Promise<AdminRevenueSummary>
}
