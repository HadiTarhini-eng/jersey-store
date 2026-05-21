import { desc, eq, sql } from 'drizzle-orm'
import { type Guid } from '../../core/entities/base.js'
import {
  type AddressSnapshot,
  type OrderStatus,
  type PaymentStatus,
} from '../../core/entities/commerce.js'
import {
  type AdminCustomerSummary,
  type AdminOrderItemSummary,
  type AdminOrderSummary,
  type IAdminService,
} from '../../core/services/admin.svc.js'
import { orders, orderItems, users } from '../database/schema.js'
import { assertGuid } from './validators.js'

/**
 * Admin aggregate reads. Single joined query per list view — avoids the N+1
 * pattern the client used to do (list users → per-user orders → per-order items).
 */
export class AdminService implements IAdminService {
  async listCustomers(): Promise<AdminCustomerSummary[]> {
    const db = await this.getDb()

    const orderAggregates = db
      .select({
        userId: orders.userId,
        ordersCount: sql<number>`COUNT(${orders.id})`.as('orders_count'),
        totalSpent: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`.as('total_spent'),
      })
      .from(orders)
      .groupBy(orders.userId)
      .as('order_aggregates')

    const latestAddress = db
      .select({
        userId: orders.userId,
        shippingAddress: orders.shippingAddress,
        rowNumber: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${orders.userId} ORDER BY ${orders.createdAt} DESC)`.as('rn'),
      })
      .from(orders)
      .as('latest_address')

    const rows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        ordersCount: orderAggregates.ordersCount,
        totalSpent: orderAggregates.totalSpent,
        shippingAddress: latestAddress.shippingAddress,
        rowNumber: latestAddress.rowNumber,
      })
      .from(users)
      .leftJoin(orderAggregates, eq(orderAggregates.userId, users.id))
      .leftJoin(latestAddress, eq(latestAddress.userId, users.id))
      .where(eq(users.role, 'User'))
      .orderBy(desc(users.createdAt))

    const dedup = new Map<Guid, AdminCustomerSummary>()
    for (const row of rows) {
      if (dedup.has(row.id) && (row.rowNumber ?? Infinity) !== 1) continue
      const address = (row.rowNumber === 1 ? row.shippingAddress : null) as AddressSnapshot | null
      dedup.set(row.id, {
        id:          row.id,
        firstName:   row.firstName,
        lastName:    row.lastName,
        email:       row.email,
        phone:       row.phone ?? null,
        country:     address?.country ?? null,
        ordersCount: Number(row.ordersCount ?? 0),
        totalSpent:  Number(row.totalSpent ?? 0),
        joinedAt:    row.createdAt,
        isActive:    row.isActive,
      })
    }
    return [...dedup.values()]
  }

  async listOrders(): Promise<AdminOrderSummary[]> {
    const db = await this.getDb()

    const orderRows = await db
      .select({
        id:              orders.id,
        orderNumber:     orders.orderNumber,
        status:          orders.status,
        paymentStatus:   orders.paymentStatus,
        subtotal:        orders.subtotal,
        shippingAmount:  orders.shippingAmount,
        totalAmount:     orders.totalAmount,
        shippingAddress: orders.shippingAddress,
        billingAddress:  orders.billingAddress,
        placedAt:        orders.placedAt,
        createdAt:       orders.createdAt,
        userId:          users.id,
        firstName:       users.firstName,
        lastName:        users.lastName,
        email:           users.email,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .orderBy(desc(orders.createdAt))

    if (orderRows.length === 0) return []

    const orderIds = orderRows.map((row: any) => row.id as Guid)
    const itemRows = await db
      .select({
        orderId:              orderItems.orderId,
        productVariantId:     orderItems.productVariantId,
        productTitleSnapshot: orderItems.productTitleSnapshot,
        variantSnapshot:      orderItems.variantSnapshotJson,
        quantity:             orderItems.quantity,
        unitPrice:            orderItems.unitPrice,
        totalPrice:           orderItems.totalPrice,
      })
      .from(orderItems)
      .where(sql`${orderItems.orderId} IN ${orderIds}`)

    const itemsByOrder = new Map<Guid, AdminOrderItemSummary[]>()
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId as Guid) ?? []
      list.push(toItemSummary(item))
      itemsByOrder.set(item.orderId as Guid, list)
    }

    return orderRows.map((row: any) => toOrderSummary(row, itemsByOrder.get(row.id as Guid) ?? []))
  }

  async getOrder(id: Guid): Promise<AdminOrderSummary | null> {
    assertGuid(id, 'orderId')
    const db = await this.getDb()
    const orderRow = await db
      .select({
        id:              orders.id,
        orderNumber:     orders.orderNumber,
        status:          orders.status,
        paymentStatus:   orders.paymentStatus,
        subtotal:        orders.subtotal,
        shippingAmount:  orders.shippingAmount,
        totalAmount:     orders.totalAmount,
        shippingAddress: orders.shippingAddress,
        billingAddress:  orders.billingAddress,
        placedAt:        orders.placedAt,
        createdAt:       orders.createdAt,
        userId:          users.id,
        firstName:       users.firstName,
        lastName:        users.lastName,
        email:           users.email,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .where(eq(orders.id, id))
      .limit(1)

    if (orderRow.length === 0) return null

    const items = await db
      .select({
        orderId:              orderItems.orderId,
        productVariantId:     orderItems.productVariantId,
        productTitleSnapshot: orderItems.productTitleSnapshot,
        variantSnapshot:      orderItems.variantSnapshotJson,
        quantity:             orderItems.quantity,
        unitPrice:            orderItems.unitPrice,
        totalPrice:           orderItems.totalPrice,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, id))

    return toOrderSummary(orderRow[0], items.map(toItemSummary))
  }

  private async getDb(): Promise<any> {
    const { db } = await import('../database/db.js')
    return db
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getItemSize(snapshot: Record<string, unknown> | null | undefined): string {
  if (!snapshot) return 'Standard'
  const label = snapshot.label
  return typeof label === 'string' && label.trim() ? label : 'Standard'
}

function toItemSummary(row: any): AdminOrderItemSummary {
  return {
    productVariantId:     row.productVariantId,
    productTitleSnapshot: row.productTitleSnapshot,
    size:                 getItemSize(row.variantSnapshot),
    quantity:             Number(row.quantity ?? 0),
    unitPrice:            Number(row.unitPrice ?? 0),
    totalPrice:           Number(row.totalPrice ?? 0),
  }
}

function toOrderSummary(row: any, items: AdminOrderItemSummary[]): AdminOrderSummary {
  return {
    id:              row.id,
    orderNumber:     row.orderNumber,
    customer: {
      id:        row.userId,
      firstName: row.firstName,
      lastName:  row.lastName,
      email:     row.email,
    },
    items,
    itemsCount:      items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal:        Number(row.subtotal ?? 0),
    shippingAmount:  Number(row.shippingAmount ?? 0),
    totalAmount:     Number(row.totalAmount ?? 0),
    status:          row.status as OrderStatus,
    paymentStatus:   row.paymentStatus as PaymentStatus,
    shippingAddress: row.shippingAddress as AddressSnapshot,
    billingAddress:  row.billingAddress as AddressSnapshot,
    createdAt:       row.createdAt,
    placedAt:        row.placedAt ?? null,
  }
}
