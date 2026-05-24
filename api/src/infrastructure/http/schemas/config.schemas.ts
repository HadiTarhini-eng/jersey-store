import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })

// ── Site config ──────────────────────────────────────────────────────────────

const SortOption = Type.Object({
  value: Type.String({ minLength: 1 }),
  label: Type.String({ minLength: 1 }),
})

const UpdateSiteConfigBody = Type.Partial(Type.Object({
  name: Type.String({ minLength: 1 }),
  tagline: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  email: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  currency: Type.String({ minLength: 1, maxLength: 8 }),
  freeShippingThreshold: Type.Number({ minimum: 0 }),
  socialLinks: Type.Record(Type.String(), Type.String()),
  heroDesignYourOwnLabel: Type.Union([Type.String(), Type.Null()]),
  heroDesignYourOwnHref: Type.Union([Type.String(), Type.Null()]),
  filterMinPrice: Type.Number({ minimum: 0 }),
  filterMaxPrice: Type.Number({ minimum: 0 }),
  sortOptions: Type.Array(SortOption),
  cartEmptyMessage: Type.Union([Type.String(), Type.Null()]),
  cartEmptyCtaLabel: Type.Union([Type.String(), Type.Null()]),
  cartEmptyCtaHref: Type.Union([Type.String(), Type.Null()]),
}))
export type UpdateSiteConfigBodyType = Static<typeof UpdateSiteConfigBody>

const LogoUploadBody = Type.Object({
  file: Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Logo image. image/*.' }),
})

export const getSiteConfigSchema: FastifySchema = { tags: ['Config'] }
export const updateSiteConfigSchema: FastifySchema = { tags: ['Config'], body: UpdateSiteConfigBody }
// Multipart: handler parses `file` part via request.file().
export const setSiteLogoSchema: FastifySchema = { tags: ['Config'], consumes: ['multipart/form-data'], description: 'Multipart: `file` (logo image).' }
export const removeSiteLogoSchema: FastifySchema = { tags: ['Config'] }

// ── Shipping methods ─────────────────────────────────────────────────────────

const ShippingMethodBody = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  baseRate: Type.Number({ minimum: 0 }),
  freeShippingThreshold: Type.Optional(Type.Union([Type.Number({ minimum: 0 }), Type.Null()])),
  estimatedDaysMin: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  estimatedDaysMax: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  sortOrder: Type.Optional(Type.Integer({ minimum: 0 })),
})
export type ShippingMethodBodyType = Static<typeof ShippingMethodBody>

const UpdateShippingMethodBody = Type.Partial(Type.Intersect([
  ShippingMethodBody,
  Type.Object({ isActive: Type.Boolean() }),
]))
export type UpdateShippingMethodBodyType = Static<typeof UpdateShippingMethodBody>

const ShippingListQuery = Type.Object({ isActive: Type.Optional(Type.Boolean()) })
export type ShippingListQueryType = Static<typeof ShippingListQuery>

export const createShippingMethodSchema: FastifySchema = { tags: ['Shipping'], body: ShippingMethodBody }
export const listShippingMethodsSchema: FastifySchema = { tags: ['Shipping'], querystring: ShippingListQuery }
export const getShippingMethodSchema: FastifySchema = { tags: ['Shipping'], params: IdParams }
export const updateShippingMethodSchema: FastifySchema = { tags: ['Shipping'], params: IdParams, body: UpdateShippingMethodBody }
export const activateShippingMethodSchema: FastifySchema = { tags: ['Shipping'], params: IdParams }
export const deactivateShippingMethodSchema: FastifySchema = { tags: ['Shipping'], params: IdParams }
export const deleteShippingMethodSchema: FastifySchema = { tags: ['Shipping'], params: IdParams }
