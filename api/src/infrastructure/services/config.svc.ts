import { type Guid } from '../../core/entities/base.js'
import { ShippingMethod, SiteConfig } from '../../core/entities/config.js'
import {
  type CreateShippingMethodInput,
  type IShippingMethodService,
  type ISiteConfigService,
} from '../../core/services/config.svc.js'
import { type ImageFile, type IStorageService } from '../../core/services/storage.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { NotFoundError } from './errors.js'
import { deleteInlineImage, uploadInlineImage } from './image.svc.js'
import { assertGuid, assertNonNegativeNumber, assertRequiredString } from './validators.js'

const DEFAULT_SLUG = 'default'

export class SiteConfigService implements ISiteConfigService {
  constructor(
    private readonly repository: EntityRepository<SiteConfig>,
    private readonly storage: IStorageService,
  ) {}

  async getBySlug(slug: string): Promise<SiteConfig | null> {
    assertRequiredString(slug, 'slug')
    return this.repository.findBy('slug', slug)
  }

  async getDefault(): Promise<SiteConfig> {
    const existing = await this.repository.findBy('slug', DEFAULT_SLUG)
    if (existing) return existing
    const seeded = new SiteConfig({
      slug: DEFAULT_SLUG,
      name: 'Jersey Store',
      currency: 'USD',
      freeShippingThreshold: 0,
      socialLinks: {},
      filterMinPrice: 0,
      filterMaxPrice: 1000,
      sortOptions: [],
    })
    return this.repository.create(seeded)
  }

  async updateDefault(data: Partial<SiteConfig>): Promise<SiteConfig> {
    const existing = await this.getDefault()
    if (data.name !== undefined) assertRequiredString(data.name, 'name')
    if (data.currency !== undefined) assertRequiredString(data.currency, 'currency', 8)
    if (data.freeShippingThreshold !== undefined) assertNonNegativeNumber(data.freeShippingThreshold, 'freeShippingThreshold')
    if (data.filterMinPrice !== undefined) assertNonNegativeNumber(data.filterMinPrice, 'filterMinPrice')
    if (data.filterMaxPrice !== undefined) assertNonNegativeNumber(data.filterMaxPrice, 'filterMaxPrice')
    return this.repository.update(existing.id, data)
  }

  async setDefaultLogo(file: ImageFile, uploadedBy: Guid): Promise<SiteConfig> {
    assertGuid(uploadedBy, 'uploadedBy')
    const existing = await this.getDefault()
    await deleteInlineImage(this.storage, existing.logoUrl)
    const uploaded = await uploadInlineImage(this.storage, file)
    return this.repository.update(existing.id, { logoUrl: uploaded.url } as Partial<SiteConfig>)
  }

  async removeDefaultLogo(): Promise<SiteConfig> {
    const existing = await this.getDefault()
    await deleteInlineImage(this.storage, existing.logoUrl)
    return this.repository.update(existing.id, { logoUrl: null } as Partial<SiteConfig>)
  }
}

export class ShippingMethodService implements IShippingMethodService {
  constructor(private readonly repository: EntityRepository<ShippingMethod>) {}

  async create(data: CreateShippingMethodInput): Promise<ShippingMethod> {
    assertRequiredString(data.name, 'name')
    assertNonNegativeNumber(data.baseRate, 'baseRate')
    const method = new ShippingMethod({
      name: data.name,
      description: data.description ?? null,
      baseRate: data.baseRate,
      freeShippingThreshold: data.freeShippingThreshold ?? null,
      estimatedDaysMin: data.estimatedDaysMin ?? null,
      estimatedDaysMax: data.estimatedDaysMax ?? null,
      sortOrder: data.sortOrder ?? 0,
    })
    return this.repository.create(method)
  }

  async list(filters: { isActive?: boolean } = {}): Promise<ShippingMethod[]> {
    const all = await this.repository.list()
    const filtered = filters.isActive === undefined
      ? all
      : all.filter((m) => m.isActive === filters.isActive)
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async getById(id: Guid): Promise<ShippingMethod | null> {
    assertGuid(id)
    return this.repository.get(id)
  }

  async update(id: Guid, data: Partial<ShippingMethod>): Promise<ShippingMethod> {
    assertGuid(id)
    if (data.name !== undefined) assertRequiredString(data.name, 'name')
    if (data.baseRate !== undefined) assertNonNegativeNumber(data.baseRate, 'baseRate')
    return this.repository.update(id, data)
  }

  async activate(id: Guid): Promise<ShippingMethod> {
    assertGuid(id)
    return this.repository.update(id, { isActive: true } as Partial<ShippingMethod>)
  }

  async deactivate(id: Guid): Promise<ShippingMethod> {
    assertGuid(id)
    return this.repository.update(id, { isActive: false } as Partial<ShippingMethod>)
  }

  async delete(id: Guid): Promise<void> {
    assertGuid(id)
    const existing = await this.repository.get(id)
    if (!existing) throw new NotFoundError('Shipping method')
    await this.repository.delete(id)
  }
}
