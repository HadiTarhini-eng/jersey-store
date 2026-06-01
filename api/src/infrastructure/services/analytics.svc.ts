import { and, desc, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm'
import { AnalyticsDaily } from '../../core/entities/analytics.js'
import {
  type AnalyticsActivity,
  type AnalyticsDayPoint,
  type AnalyticsMonthPoint,
  type AnalyticsOverview,
  type AnalyticsRange,
  type AnalyticsTopCategory,
  type AnalyticsTopProduct,
  type IAnalyticsService,
} from '../../core/services/analytics.svc.js'
import { categories, orderItems, orders, productVariants, products, users } from '../database/schema.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { assertDateRange } from './validators.js'

const toDayString = (date: Date): string => date.toISOString().slice(0, 10)
const startOfDay = (date: Date): Date => {
  const copy = new Date(date)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}
const endOfDay = (date: Date): Date => {
  const copy = new Date(date)
  copy.setUTCHours(23, 59, 59, 999)
  return copy
}
const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

const percentDelta = (current: number, previous: number): number => {
  if (previous === 0) return current === 0 ? 0 : 100
  return Number((((current - previous) / previous) * 100).toFixed(2))
}

export class AnalyticsService implements IAnalyticsService {
  constructor(private readonly repository: EntityRepository<AnalyticsDaily>) {}

  async recomputeDay(day: Date): Promise<AnalyticsDaily> {
    const db = await this.getDb()
    const dayStr = toDayString(day)
    const start = startOfDay(day)
    const end = endOfDay(day)

    const orderRows = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .where(and(gte(orders.placedAt, start), lte(orders.placedAt, end)))

    const orderIds = orderRows.map((row: any) => row.id)
    let unitCount = 0
    if (orderIds.length > 0) {
      const itemAgg = await db
        .select({ total: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)` })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
      unitCount = Number(itemAgg[0]?.total ?? 0)
    }

    const newCustomerRows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(gte(users.createdAt, start), lte(users.createdAt, end)))

    const revenue = orderRows.reduce((sum: number, row: any) => sum + Number(row.totalAmount), 0)
    const orderCount = orderRows.length
    const newCustomers = newCustomerRows.length

    const existing = await this.repository.findBy('day', dayStr)
    if (existing) {
      return this.repository.update(existing.id, {
        revenue,
        orderCount,
        unitCount,
        newCustomers,
      } as Partial<AnalyticsDaily>)
    }

    const entity = new AnalyticsDaily({ day: dayStr, revenue, orderCount, unitCount, newCustomers })
    return this.repository.create(entity)
  }

  async recomputeRange(range: AnalyticsRange): Promise<AnalyticsDaily[]> {
    assertDateRange(range.from, range.to)
    const results: AnalyticsDaily[] = []
    let cursor = startOfDay(range.from)
    const limit = startOfDay(range.to)
    while (cursor <= limit) {
      results.push(await this.recomputeDay(cursor))
      cursor = addDays(cursor, 1)
    }
    return results
  }

  async getOverview(range: AnalyticsRange): Promise<AnalyticsOverview> {
    assertDateRange(range.from, range.to)
    const span = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000))
    const previousTo = addDays(startOfDay(range.from), -1)
    const previousFrom = addDays(previousTo, -(span - 1))

    const current = await this.aggregateRange(range.from, range.to)
    const previous = await this.aggregateRange(previousFrom, previousTo)

    return {
      revenue:   { value: current.revenue,   deltaPct: percentDelta(current.revenue, previous.revenue) },
      orders:    { value: current.orders,    deltaPct: percentDelta(current.orders, previous.orders) },
      customers: { value: current.customers, deltaPct: percentDelta(current.customers, previous.customers) },
      units:     { value: current.units,     deltaPct: percentDelta(current.units, previous.units) },
    }
  }

  async getSalesByDay(range: AnalyticsRange): Promise<AnalyticsDayPoint[]> {
    assertDateRange(range.from, range.to)
    const db = await this.getDb()
    const dayExpr = sql<string>`to_char(${orders.placedAt}, 'YYYY-MM-DD')`
    const rows = await db
      .select({
        day: dayExpr,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN ${orders.totalAmount} ELSE 0 END), 0)`,
        orders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(
        gte(orders.placedAt, startOfDay(range.from)),
        lte(orders.placedAt, endOfDay(range.to)),
        ne(orders.status, 'cancelled'),
      ))
      .groupBy(dayExpr)
      .orderBy(dayExpr)
    return rows.map((row: any) => ({ day: row.day, revenue: Number(row.revenue), orders: Number(row.orders) }))
  }

  async getRevenueByMonth(year: number): Promise<AnalyticsMonthPoint[]> {
    const from = new Date(Date.UTC(year, 0, 1))
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
    const db = await this.getDb()
    const monthExpr = sql<string>`to_char(${orders.placedAt}, 'YYYY-MM')`
    const rows = await db
      .select({
        month: monthExpr,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN ${orders.totalAmount} ELSE 0 END), 0)`,
      })
      .from(orders)
      .where(and(
        gte(orders.placedAt, from),
        lte(orders.placedAt, to),
        ne(orders.status, 'cancelled'),
      ))
      .groupBy(monthExpr)
      .orderBy(monthExpr)
    return rows.map((row: any) => ({ month: row.month, revenue: Number(row.revenue) }))
  }

  /**
   * Live aggregate of a date range straight from orders/order_items/users — no
   * precomputed snapshot, so the dashboard always reflects the real database.
   * Revenue counts ONLY paid orders; order/unit counts exclude cancelled;
   * "customers" counts user signups in the window (independent of orders).
   */
  private async aggregateRange(from: Date, to: Date): Promise<{ revenue: number; orders: number; units: number; customers: number }> {
    const db = await this.getDb()
    const start = startOfDay(from)
    const end = endOfDay(to)
    const inWindow = and(gte(orders.placedAt, start), lte(orders.placedAt, end), ne(orders.status, 'cancelled'))

    const [orderAgg, unitAgg, customerAgg] = await Promise.all([
      db.select({
        // Revenue is realised only once the order is marked paid.
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN ${orders.totalAmount} ELSE 0 END), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(orders).where(inWindow),
      db.select({
        units: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      }).from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(inWindow),
      db.select({
        count: sql<number>`COUNT(*)`,
      }).from(users).where(and(gte(users.createdAt, start), lte(users.createdAt, end))),
    ])

    return {
      revenue: Number(orderAgg[0]?.revenue ?? 0),
      orders: Number(orderAgg[0]?.count ?? 0),
      units: Number(unitAgg[0]?.units ?? 0),
      customers: Number(customerAgg[0]?.count ?? 0),
    }
  }

  async getTopProducts(range: AnalyticsRange, limit: number): Promise<AnalyticsTopProduct[]> {
    assertDateRange(range.from, range.to)
    const db = await this.getDb()
    const rows = await db
      .select({
        productId: products.id,
        name: products.title,
        units: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
        revenue: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(gte(orders.placedAt, startOfDay(range.from)), lte(orders.placedAt, endOfDay(range.to))))
      .groupBy(products.id, products.title)
      .orderBy(desc(sql`SUM(${orderItems.totalPrice})`))
      .limit(limit)

    return rows.map((row: any) => ({
      productId: row.productId,
      name: row.name,
      units: Number(row.units),
      revenue: Number(row.revenue),
    }))
  }

  async getTopCategories(range: AnalyticsRange, limit: number): Promise<AnalyticsTopCategory[]> {
    assertDateRange(range.from, range.to)
    const db = await this.getDb()
    const rows = await db
      .select({
        categoryId: categories.id,
        name: categories.name,
        revenue: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(gte(orders.placedAt, startOfDay(range.from)), lte(orders.placedAt, endOfDay(range.to))))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`SUM(${orderItems.totalPrice})`))
      .limit(limit)

    return rows.map((row: any) => ({
      categoryId: row.categoryId,
      name: row.name,
      revenue: Number(row.revenue),
    }))
  }

  async getRecentActivity(limit: number): Promise<AnalyticsActivity[]> {
    const db = await this.getDb()
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)

    const recentUsers = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, createdAt: users.createdAt })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)

    const activities: AnalyticsActivity[] = [
      ...recentOrders.map((row: any) => ({
        id: `order-${row.id}`,
        type: 'order' as const,
        message: `Order ${row.orderNumber} for ${Number(row.totalAmount).toFixed(2)}`,
        at: row.createdAt,
      })),
      ...recentUsers.map((row: any) => ({
        id: `customer-${row.id}`,
        type: 'customer' as const,
        message: `${row.firstName} ${row.lastName} joined`,
        at: row.createdAt,
      })),
    ]

    return activities
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit)
  }

  private async getDb(): Promise<any> {
    const { db } = await import('../database/db.js')
    return db
  }
}
