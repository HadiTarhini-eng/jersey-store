import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IAnalyticsService } from '../../../core/services/analytics.svc.js'
import { sendOk } from '../routes/route-utils.js'
import type {
  MonthQueryType,
  RangeQueryType,
  RecentQueryType,
  RecomputeBodyType,
  TopQueryType,
} from '../schemas/analytics.schemas.js'

const DEFAULT_DAYS = 30
const DEFAULT_TOP = 5
const DEFAULT_RECENT = 10

const parseRange = (query: RangeQueryType): { from: Date; to: Date } => {
  const to = query.to ? new Date(query.to) : new Date()
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - DEFAULT_DAYS * 86_400_000)
  return { from, to }
}

export const getAnalyticsOverview = (service: IAnalyticsService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getOverview(parseRange(request.query as RangeQueryType)))
  }

export const getSalesByDay = (service: IAnalyticsService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    sendOk(reply, await service.getSalesByDay(parseRange(request.query as RangeQueryType)))
  }

export const getRevenueByMonth = (service: IAnalyticsService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { year } = request.query as MonthQueryType
    sendOk(reply, await service.getRevenueByMonth(year ?? new Date().getUTCFullYear()))
  }

export const getTopProducts = (service: IAnalyticsService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as TopQueryType
    const { limit, ...range } = query
    sendOk(reply, await service.getTopProducts(parseRange(range), limit ?? DEFAULT_TOP))
  }

export const getTopCategories = (service: IAnalyticsService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as TopQueryType
    const { limit, ...range } = query
    sendOk(reply, await service.getTopCategories(parseRange(range), limit ?? DEFAULT_TOP))
  }

export const getRecentActivity = (service: IAnalyticsService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { limit } = request.query as RecentQueryType
    sendOk(reply, await service.getRecentActivity(limit ?? DEFAULT_RECENT))
  }

export const recomputeAnalytics = (service: IAnalyticsService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { from, to } = request.body as RecomputeBodyType
    sendOk(reply, await service.recomputeRange({ from: new Date(from), to: new Date(to) }))
  }
