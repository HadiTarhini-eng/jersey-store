import type { RouteOptions } from 'fastify'
import type { IAnalyticsService } from '../../../../core/services/analytics.svc.js'
import * as ctrl from '../../controllers/analytics.ctrl.js'
import * as s from '../../schemas/analytics.schemas.js'

export const analyticsRoutes = (service: IAnalyticsService): RouteOptions[] => [
  { method: 'GET',  url: '/admin/analytics/overview',          roles: ['Admin'], schema: s.getOverviewSchema,         handler: ctrl.getAnalyticsOverview(service) },
  { method: 'GET',  url: '/admin/analytics/sales-by-day',      roles: ['Admin'], schema: s.getSalesByDaySchema,       handler: ctrl.getSalesByDay(service) },
  { method: 'GET',  url: '/admin/analytics/revenue-by-month',  roles: ['Admin'], schema: s.getRevenueByMonthSchema,   handler: ctrl.getRevenueByMonth(service) },
  { method: 'GET',  url: '/admin/analytics/top-products',      roles: ['Admin'], schema: s.getTopProductsSchema,      handler: ctrl.getTopProducts(service) },
  { method: 'GET',  url: '/admin/analytics/top-categories',    roles: ['Admin'], schema: s.getTopCategoriesSchema,    handler: ctrl.getTopCategories(service) },
  { method: 'GET',  url: '/admin/analytics/recent-activity',   roles: ['Admin'], schema: s.getRecentActivitySchema,   handler: ctrl.getRecentActivity(service) },
  { method: 'POST', url: '/admin/analytics/recompute',         roles: ['Admin'], schema: s.recomputeAnalyticsSchema,  handler: ctrl.recomputeAnalytics(service) },
]
