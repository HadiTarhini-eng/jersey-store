import { BaseEntity, type BusinessEntity, type BusinessEntityPayload } from './base.js'

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
