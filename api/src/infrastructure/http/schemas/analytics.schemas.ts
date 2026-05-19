import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const RangeQuery = Type.Object({
  from: Type.Optional(Type.String()), // ISO date — defaults to 30 days ago
  to: Type.Optional(Type.String()),   // ISO date — defaults to today
})
export type RangeQueryType = Static<typeof RangeQuery>

const TopQuery = Type.Intersect([
  RangeQuery,
  Type.Object({ limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })) }),
])
export type TopQueryType = Static<typeof TopQuery>

const RecentQuery = Type.Object({ limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })) })
export type RecentQueryType = Static<typeof RecentQuery>

const MonthQuery = Type.Object({ year: Type.Optional(Type.Integer({ minimum: 1970, maximum: 2200 })) })
export type MonthQueryType = Static<typeof MonthQuery>

const RecomputeBody = Type.Object({
  from: Type.String(),
  to: Type.String(),
})
export type RecomputeBodyType = Static<typeof RecomputeBody>

export const getOverviewSchema: FastifySchema = { tags: ['Analytics'], querystring: RangeQuery }
export const getSalesByDaySchema: FastifySchema = { tags: ['Analytics'], querystring: RangeQuery }
export const getRevenueByMonthSchema: FastifySchema = { tags: ['Analytics'], querystring: MonthQuery }
export const getTopProductsSchema: FastifySchema = { tags: ['Analytics'], querystring: TopQuery }
export const getTopCategoriesSchema: FastifySchema = { tags: ['Analytics'], querystring: TopQuery }
export const getRecentActivitySchema: FastifySchema = { tags: ['Analytics'], querystring: RecentQuery }
export const recomputeAnalyticsSchema: FastifySchema = { tags: ['Analytics'], body: RecomputeBody }
