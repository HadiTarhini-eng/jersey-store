import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
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
import { analyticsDaily, categories, orderItems, orders, productVariants, products, users } from '../database/schema.js'
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
    const currentRows = await this.loadRange(range.from, range.to)
    const span = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000))
    const previousTo = addDays(startOfDay(range.from), -1)
    const previousFrom = addDays(previousTo, -(span - 1))
    const previousRows = await this.loadRange(previousFrom, previousTo)

    const sum = (rows: AnalyticsDaily[], key: keyof Pick<AnalyticsDaily, 'revenue' | 'orderCount' | 'unitCount' | 'newCustomers'>): number =>
      rows.reduce((acc, row) => acc + Number(row[key] ?? 0), 0)

    const revenue = sum(currentRows, 'revenue')
    const orders = sum(currentRows, 'orderCount')
    const units = sum(currentRows, 'unitCount')
    const customers = sum(currentRows, 'newCustomers')

    return {
      revenue: { value: revenue, deltaPct: percentDelta(revenue, sum(previousRows, 'revenue')) },
      orders: { value: orders, deltaPct: percentDelta(orders, sum(previousRows, 'orderCount')) },
      customers: { value: customers, deltaPct: percentDelta(customers, sum(previousRows, 'newCustomers')) },
      units: { value: units, deltaPct: percentDelta(units, sum(previousRows, 'unitCount')) },
    }
  }

  async getSalesByDay(range: AnalyticsRange): Promise<AnalyticsDayPoint[]> {
    assertDateRange(range.from, range.to)
    const rows = await this.loadRange(range.from, range.to)
    return rows.map((row) => ({ day: row.day, revenue: Number(row.revenue), orders: row.orderCount }))
  }

  async getRevenueByMonth(year: number): Promise<AnalyticsMonthPoint[]> {
    const from = new Date(Date.UTC(year, 0, 1))
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
    const rows = await this.loadRange(from, to)
    const buckets = new Map<string, number>()
    for (const row of rows) {
      const month = row.day.slice(0, 7)
      buckets.set(month, (buckets.get(month) ?? 0) + Number(row.revenue))
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }))
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

  private async loadRange(from: Date, to: Date): Promise<AnalyticsDaily[]> {
    const fromStr = toDayString(startOfDay(from))
    const toStr = toDayString(startOfDay(to))
    const db = await this.getDb()
    const rows = await db
      .select()
      .from(analyticsDaily)
      .where(and(gte(analyticsDaily.day, fromStr), lte(analyticsDaily.day, toStr)))
      .orderBy(analyticsDaily.day)
    return rows.map((row: any) => new AnalyticsDaily({
      ...row,
      revenue: Number(row.revenue ?? 0),
      orderCount: row.orderCount ?? 0,
      unitCount: row.unitCount ?? 0,
      newCustomers: row.newCustomers ?? 0,
    }))
  }

  private async getDb(): Promise<any> {
    const { db } = await import('../database/db.js')
    return db
  }
}
