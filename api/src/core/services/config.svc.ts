import { type Guid } from '../entities/base.js'
import { type ShippingMethod, type SiteConfig } from '../entities/config.js'
import { type ImageFile } from './storage.svc.js'

export interface ISiteConfigService {
  getBySlug: (slug: string) => Promise<SiteConfig | null>
  getDefault: () => Promise<SiteConfig>
  updateDefault: (data: Partial<SiteConfig>) => Promise<SiteConfig>
  setDefaultLogo: (file: ImageFile, uploadedBy: Guid) => Promise<SiteConfig>
  removeDefaultLogo: () => Promise<SiteConfig>
}

export interface CreateShippingMethodInput {
  name: string
  description?: string | null
  baseRate: number
  freeShippingThreshold?: number | null
  estimatedDaysMin?: number | null
  estimatedDaysMax?: number | null
  sortOrder?: number
}

export interface IShippingMethodService {
  create: (data: CreateShippingMethodInput) => Promise<ShippingMethod>
  list: (filters?: { isActive?: boolean }) => Promise<ShippingMethod[]>
  getById: (id: Guid) => Promise<ShippingMethod | null>
  update: (id: Guid, data: Partial<ShippingMethod>) => Promise<ShippingMethod>
  activate: (id: Guid) => Promise<ShippingMethod>
  deactivate: (id: Guid) => Promise<ShippingMethod>
  delete: (id: Guid) => Promise<void>
}
