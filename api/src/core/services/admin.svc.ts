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
  customer:         { id: Guid; firstName: string; lastName: string; email: string }
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
}

export interface IAdminService {
  listCustomers: () => Promise<AdminCustomerSummary[]>
  listOrders:    () => Promise<AdminOrderSummary[]>
  getOrder:      (id: Guid) => Promise<AdminOrderSummary | null>
}
