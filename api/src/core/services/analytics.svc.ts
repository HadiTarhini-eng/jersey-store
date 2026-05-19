import { type AnalyticsDaily } from '../entities/analytics.js'

export interface AnalyticsKpi {
  value: number
  deltaPct: number
}

export interface AnalyticsOverview {
  revenue: AnalyticsKpi
  orders: AnalyticsKpi
  customers: AnalyticsKpi
  units: AnalyticsKpi
}

export interface AnalyticsDayPoint {
  day: string
  revenue: number
  orders: number
}

export interface AnalyticsMonthPoint {
  month: string // YYYY-MM
  revenue: number
}

export interface AnalyticsTopProduct {
  productId: string
  name: string
  units: number
  revenue: number
}

export interface AnalyticsTopCategory {
  categoryId: string
  name: string
  revenue: number
}

export interface AnalyticsActivity {
  id: string
  type: 'order' | 'customer'
  message: string
  at: Date
}

export interface AnalyticsRange {
  from: Date
  to: Date
}

export interface IAnalyticsService {
  recomputeDay: (day: Date) => Promise<AnalyticsDaily>
  recomputeRange: (range: AnalyticsRange) => Promise<AnalyticsDaily[]>
  getOverview: (range: AnalyticsRange) => Promise<AnalyticsOverview>
  getSalesByDay: (range: AnalyticsRange) => Promise<AnalyticsDayPoint[]>
  getRevenueByMonth: (year: number) => Promise<AnalyticsMonthPoint[]>
  getTopProducts: (range: AnalyticsRange, limit: number) => Promise<AnalyticsTopProduct[]>
  getTopCategories: (range: AnalyticsRange, limit: number) => Promise<AnalyticsTopCategory[]>
  getRecentActivity: (limit: number) => Promise<AnalyticsActivity[]>
}
