import { BaseEntity, type BusinessEntity, type BusinessEntityPayload } from './base.js'

export interface AnalyticsDailyEntity extends BusinessEntity {
  day: string // YYYY-MM-DD
  revenue: number
  orderCount: number
  unitCount: number
  newCustomers: number
}

export type AnalyticsDailyPayload = BusinessEntityPayload & Omit<AnalyticsDailyEntity, keyof BusinessEntity>

export class AnalyticsDaily extends BaseEntity implements AnalyticsDailyEntity {
  day: string
  revenue: number
  orderCount: number
  unitCount: number
  newCustomers: number

  constructor(input: AnalyticsDailyPayload) {
    super(input)
    this.day = input.day
    this.revenue = input.revenue ?? 0
    this.orderCount = input.orderCount ?? 0
    this.unitCount = input.unitCount ?? 0
    this.newCustomers = input.newCustomers ?? 0
  }
}
