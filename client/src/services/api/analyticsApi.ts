import { http } from './client';
import { endpoints } from './endpoints';
import type {
  AnalyticsActivityItem,
  AnalyticsDayPoint,
  AnalyticsMonthPoint,
  AnalyticsOverview,
  AnalyticsRangeQuery,
  AnalyticsTopCategory,
  AnalyticsTopProduct,
} from '../../types';

export const analyticsApi = {
  overview:       (params: AnalyticsRangeQuery = {})                  => http.get<AnalyticsOverview>(endpoints.analytics.overview(), { params }),
  salesByDay:     (params: AnalyticsRangeQuery = {})                  => http.get<AnalyticsDayPoint[]>(endpoints.analytics.salesByDay(), { params }),
  revenueByMonth: (year?: number)                                     => http.get<AnalyticsMonthPoint[]>(endpoints.analytics.revenueByMonth(), { params: year ? { year } : undefined }),
  topProducts:    (params: AnalyticsRangeQuery & { limit?: number } = {}) => http.get<AnalyticsTopProduct[]>(endpoints.analytics.topProducts(), { params }),
  topCategories:  (params: AnalyticsRangeQuery & { limit?: number } = {}) => http.get<AnalyticsTopCategory[]>(endpoints.analytics.topCategories(), { params }),
  recentActivity: (limit?: number)                                    => http.get<AnalyticsActivityItem[]>(endpoints.analytics.recentActivity(), { params: limit ? { limit } : undefined }),
  recompute:      (from: string, to: string)                          => http.post<unknown>(endpoints.analytics.recompute(), { from, to }),
};
