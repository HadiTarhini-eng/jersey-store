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
  type AdminRevenueSummary,
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
        createdAt:           orders.createdAt,
        guestEmail:          orders.guestEmail,
        rejectionReason:     orders.rejectionReason,
        adminMessageReadAt:  orders.adminMessageReadAt,
        userId:          users.id,
        firstName:       users.firstName,
        lastName:        users.lastName,
        email:           users.email,
      })
      .from(orders)
      // LEFT JOIN so guest orders (orders.userId IS NULL) still surface in
      // the admin list — the inner join previously dropped them silently.
      .leftJoin(users, eq(users.id, orders.userId))
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
        createdAt:           orders.createdAt,
        guestEmail:          orders.guestEmail,
        rejectionReason:     orders.rejectionReason,
        adminMessageReadAt:  orders.adminMessageReadAt,
        userId:          users.id,
        firstName:       users.firstName,
        lastName:        users.lastName,
        email:           users.email,
      })
      .from(orders)
      // LEFT JOIN — see listOrders for rationale. Guest orders must be
      // viewable by admins via the detail page.
      .leftJoin(users, eq(users.id, orders.userId))
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

  /**
   * Aggregate revenue across all orders. Revenue is recognised only when an
   * order reaches `delivered` — orders sitting in earlier states are tracked
   * separately as "in-flight" so the admin can see what's pending vs. earned.
   * Single SQL pass + a small in-memory roll-up per month.
   */
  async revenueSummary(): Promise<AdminRevenueSummary> {
    const db = await this.getDb()

    const rows = await db
      .select({
        id:             orders.id,
        status:         orders.status,
        totalAmount:    orders.totalAmount,
        discountAmount: orders.discountAmount,
        createdAt:      orders.createdAt,
        placedAt:       orders.placedAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))

    let totalRevenue       = 0
    let totalDiscounts     = 0
    let pendingRevenue     = 0
    let deliveredCount     = 0
    let inFlightCount      = 0
    let cancelledCount     = 0
    let last30dRevenue     = 0
    let previous30dRevenue = 0
    const byMonth     = new Map<string, { revenue: number; orders: number }>()
    const deliveredIds: string[] = []

    const now           = new Date()
    const last30Cutoff  = new Date(now); last30Cutoff.setUTCDate(now.getUTCDate() - 30)
    const prev30Cutoff  = new Date(now); prev30Cutoff.setUTCDate(now.getUTCDate() - 60)

    for (const row of rows) {
      const status = row.status as OrderStatus
      const total  = Number(row.totalAmount    ?? 0)
      const disc   = Number(row.discountAmount ?? 0)
      const stamp  = (row.placedAt ?? row.createdAt) as Date | null

      if (status === 'delivered') {
        totalRevenue   += total
        totalDiscounts += disc
        deliveredCount += 1
        deliveredIds.push(row.id as string)

        if (stamp) {
          const d = new Date(stamp)
          const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
          const cur = byMonth.get(key) ?? { revenue: 0, orders: 0 }
          cur.revenue += total
          cur.orders  += 1
          byMonth.set(key, cur)

          // Trailing-window buckets for the trend KPI.
          if (d >= last30Cutoff) {
            last30dRevenue += total
          } else if (d >= prev30Cutoff) {
            previous30dRevenue += total
          }
        }
      } else if (status === 'cancelled') {
        cancelledCount += 1
      } else {
        inFlightCount   += 1
        pendingRevenue  += total
      }
    }

    const byMonthList = [...byMonth.entries()]
      .map(([month, agg]) => ({ month, revenue: agg.revenue, orders: agg.orders }))
      .sort((a, b) => (a.month < b.month ? 1 : -1))

    // ── Top-product roll-up over delivered orders ───────────────────────────
    // One query joining the item rows we care about; group + sort in memory
    // because the result set is small (top N per dashboard load).
    let topProducts: AdminRevenueSummary['topProducts'] = []
    if (deliveredIds.length > 0) {
      const itemRows = await db
        .select({
          orderId:              orderItems.orderId,
          productVariantId:     orderItems.productVariantId,
          productTitleSnapshot: orderItems.productTitleSnapshot,
          quantity:             orderItems.quantity,
          totalPrice:           orderItems.totalPrice,
        })
        .from(orderItems)
        .where(sql`${orderItems.orderId} IN ${deliveredIds}`)

      const byVariant = new Map<string, { title: string; quantity: number; revenue: number }>()
      for (const it of itemRows) {
        const key = it.productVariantId as string
        const cur = byVariant.get(key) ?? { title: it.productTitleSnapshot as string, quantity: 0, revenue: 0 }
        cur.quantity += Number(it.quantity ?? 0)
        cur.revenue  += Number(it.totalPrice ?? 0)
        byVariant.set(key, cur)
      }

      topProducts = [...byVariant.entries()]
        .map(([productVariantId, agg]) => ({ productVariantId, ...agg }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    }

    const settled       = deliveredCount + cancelledCount
    const conversionRate = settled > 0 ? deliveredCount / settled : 0

    return {
      totalRevenue,
      totalDiscounts,
      deliveredCount,
      inFlightCount,
      cancelledCount,
      averageOrderValue: deliveredCount > 0 ? totalRevenue / deliveredCount : 0,
      pendingRevenue,
      conversionRate,
      last30dRevenue,
      previous30dRevenue,
      byMonth: byMonthList,
      topProducts,
    }
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
  // For guest orders (row.userId is null after the LEFT JOIN) we synthesise
  // a customer record from the shipping snapshot so the admin UI can still
  // show a meaningful name + email. `id: null` tells the frontend to render
  // a "Guest" label and skip the user-detail link.
  const shipping = row.shippingAddress as AddressSnapshot | null
  const customer = row.userId
    ? {
        id:        row.userId as Guid,
        firstName: row.firstName as string,
        lastName:  row.lastName  as string,
        email:     row.email     as string,
      }
    : {
        id:        null,
        firstName: shipping?.fullName ?? 'Guest',
        lastName:  '',
        email:     (row.guestEmail as string | null) ?? null,
      }

  return {
    id:              row.id,
    orderNumber:     row.orderNumber,
    customer,
    items,
    itemsCount:      items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal:        Number(row.subtotal ?? 0),
    shippingAmount:  Number(row.shippingAmount ?? 0),
    totalAmount:     Number(row.totalAmount ?? 0),
    status:          row.status as OrderStatus,
    paymentStatus:   row.paymentStatus as PaymentStatus,
    shippingAddress: row.shippingAddress as AddressSnapshot,
    billingAddress:  row.billingAddress as AddressSnapshot,
    createdAt:           row.createdAt,
    placedAt:            row.placedAt ?? null,
    rejectionReason:     (row.rejectionReason as string | null) ?? null,
    adminMessageReadAt:  (row.adminMessageReadAt as Date | null) ?? null,
  }
}
