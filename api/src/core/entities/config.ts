import { BaseEntity, type BusinessEntity, type BusinessEntityPayload } from './base.js'

export interface SortOptionConfig {
  value: string
  label: string
}

export interface SiteConfigEntity extends BusinessEntity {
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  logoUrl?: string | null
  email?: string | null
  phone?: string | null
  currency: string
  freeShippingThreshold: number
  socialLinks: Record<string, string>
  heroDesignYourOwnLabel?: string | null
  heroDesignYourOwnHref?: string | null
  filterMinPrice: number
  filterMaxPrice: number
  sortOptions: SortOptionConfig[]
  cartEmptyMessage?: string | null
  cartEmptyCtaLabel?: string | null
  cartEmptyCtaHref?: string | null
}

export type SiteConfigPayload = BusinessEntityPayload & Omit<SiteConfigEntity, keyof BusinessEntity>

export class SiteConfig extends BaseEntity implements SiteConfigEntity {
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  logoUrl?: string | null
  email?: string | null
  phone?: string | null
  currency: string
  freeShippingThreshold: number
  socialLinks: Record<string, string>
  heroDesignYourOwnLabel?: string | null
  heroDesignYourOwnHref?: string | null
  filterMinPrice: number
  filterMaxPrice: number
  sortOptions: SortOptionConfig[]
  cartEmptyMessage?: string | null
  cartEmptyCtaLabel?: string | null
  cartEmptyCtaHref?: string | null

  constructor(payload: SiteConfigPayload) {
    super(payload)
    this.slug = payload.slug
    this.name = payload.name
    this.tagline = payload.tagline ?? null
    this.description = payload.description ?? null
    this.logoUrl = payload.logoUrl ?? null
    this.email = payload.email ?? null
    this.phone = payload.phone ?? null
    this.currency = payload.currency
    this.freeShippingThreshold = payload.freeShippingThreshold ?? 0
    this.socialLinks = payload.socialLinks ?? {}
    this.heroDesignYourOwnLabel = payload.heroDesignYourOwnLabel ?? null
    this.heroDesignYourOwnHref = payload.heroDesignYourOwnHref ?? null
    this.filterMinPrice = payload.filterMinPrice ?? 0
    this.filterMaxPrice = payload.filterMaxPrice ?? 1000
    this.sortOptions = payload.sortOptions ?? []
    this.cartEmptyMessage = payload.cartEmptyMessage ?? null
    this.cartEmptyCtaLabel = payload.cartEmptyCtaLabel ?? null
    this.cartEmptyCtaHref = payload.cartEmptyCtaHref ?? null
  }
}

export interface ShippingMethodEntity extends BusinessEntity {
  name: string
  description?: string | null
  baseRate: number
  freeShippingThreshold?: number | null
  estimatedDaysMin?: number | null
  estimatedDaysMax?: number | null
  sortOrder: number
}

export type ShippingMethodPayload = BusinessEntityPayload & Omit<ShippingMethodEntity, keyof BusinessEntity>

export class ShippingMethod extends BaseEntity implements ShippingMethodEntity {
  name: string
  description?: string | null
  baseRate: number
  freeShippingThreshold?: number | null
  estimatedDaysMin?: number | null
  estimatedDaysMax?: number | null
  sortOrder: number

  constructor(payload: ShippingMethodPayload) {
    super(payload)
    this.name = payload.name
    this.description = payload.description ?? null
    this.baseRate = payload.baseRate ?? 0
    this.freeShippingThreshold = payload.freeShippingThreshold ?? null
    this.estimatedDaysMin = payload.estimatedDaysMin ?? null
    this.estimatedDaysMax = payload.estimatedDaysMax ?? null
    this.sortOrder = payload.sortOrder ?? 0
  }
}
