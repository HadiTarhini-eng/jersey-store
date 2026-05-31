import { BaseEntity, type BusinessEntity, type BusinessEntityPayload, type Guid } from './base.js'

export type ProductStatus = 'draft' | 'active' | 'archived'
export type ProductAttributeType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'date'

export interface ProductEntity extends BusinessEntity {
  categoryId: Guid
  title: string
  slug: string
  shortDescription?: string | null
  fullDescription?: string | null
  tags: string[]
  brand?: string | null
  basePrice: number
  /** Compare-at price (MSRP). When set and > basePrice, the product is on sale. */
  compareAtPrice?: number | null
  /** Gates the custom name/number print inputs on the storefront detail page. */
  printable: boolean
  status: ProductStatus
  featured: boolean
  searchVector?: string | null
  createdBy: Guid
}

export interface ProductAttributeEntity extends BusinessEntity {
  name: string
  slug: string
  type: ProductAttributeType
  isVariantable: boolean
}

export interface ProductAssignedAttributeEntity extends BusinessEntity {
  productId: Guid
  attributeId: Guid
  isRequired: boolean
  isFilterable: boolean
  sortOrder: number
}

export interface ProductAttributeOptionEntity extends BusinessEntity {
  productAssignedAttributeId: Guid
  value: string
  metaData?: Record<string, unknown> | null
  sortOrder: number
}

export interface ProductSpecificationEntity extends BusinessEntity {
  productId: Guid
  attributeId: Guid
  value: string
}

export interface ProductVariantEntity extends BusinessEntity {
  productId: Guid
  sku: string
  priceOverride?: number | null
  stockQuantity: number
  imageUrl?: string | null
  /** Admin-controlled storefront visibility. Hidden sizes don't render in the picker. */
  isVisible: boolean
}

export interface VariantAttributeValueEntity extends BusinessEntity {
  variantId: Guid
  attributeId: Guid
  attributeOptionId: Guid
}

export interface ProductPayload extends BusinessEntityPayload {
  categoryId: Guid
  title: string
  slug: string
  shortDescription?: string | null
  fullDescription?: string | null
  tags?: string[]
  brand?: string | null
  basePrice: number
  compareAtPrice?: number | null
  printable?: boolean
  status?: ProductStatus
  featured?: boolean
  searchVector?: string | null
  createdBy: Guid
}

export class Product extends BaseEntity implements ProductEntity {
  categoryId: Guid
  title: string
  slug: string
  shortDescription?: string | null
  fullDescription?: string | null
  tags: string[]
  brand?: string | null
  basePrice: number
  compareAtPrice?: number | null
  printable: boolean
  status: ProductStatus
  featured: boolean
  searchVector?: string | null
  createdBy: Guid
  /**
   * All-time units sold across non-cancelled orders. Not persisted — attached
   * by the product service on storefront search to power the "Most Popular"
   * sort. Undefined on entities that weren't enriched.
   */
  salesCount?: number

  constructor(payload: ProductPayload) {
    super(payload)
    this.categoryId = payload.categoryId
    this.title = payload.title
    this.slug = payload.slug
    this.shortDescription = payload.shortDescription
    this.fullDescription = payload.fullDescription
    this.tags = payload.tags ?? []
    this.brand = payload.brand
    this.basePrice = payload.basePrice
    this.compareAtPrice = payload.compareAtPrice ?? null
    this.printable = payload.printable ?? false
    this.status = payload.status ?? 'draft'
    this.featured = payload.featured ?? false
    this.searchVector = payload.searchVector
    this.createdBy = payload.createdBy
  }

  publish(): void {
    this.status = 'active'
    this.touch()
  }

  archive(): void {
    this.status = 'archived'
    this.deactivate()
  }

  updatePrice(basePrice: number): void {
    this.basePrice = basePrice
    this.touch()
  }

  setFeatured(featured: boolean): void {
    this.featured = featured
    this.touch()
  }
}

export type ProductAttributePayload = BusinessEntityPayload & Omit<ProductAttributeEntity, keyof BusinessEntity>
export type ProductAssignedAttributePayload = BusinessEntityPayload & Omit<ProductAssignedAttributeEntity, keyof BusinessEntity>
export type ProductAttributeOptionPayload = BusinessEntityPayload & Omit<ProductAttributeOptionEntity, keyof BusinessEntity>
export type ProductSpecificationPayload = BusinessEntityPayload & Omit<ProductSpecificationEntity, keyof BusinessEntity>
export type ProductVariantPayload = BusinessEntityPayload & Omit<ProductVariantEntity, keyof BusinessEntity | 'isVisible'> & { isVisible?: boolean }
export type VariantAttributeValuePayload = BusinessEntityPayload & Omit<VariantAttributeValueEntity, keyof BusinessEntity>

export class ProductAttribute extends BaseEntity implements ProductAttributeEntity {
  name: string
  slug: string
  type: ProductAttributeType
  isVariantable: boolean

  constructor(payload: ProductAttributePayload) {
    super(payload)
    this.name = payload.name
    this.slug = payload.slug
    this.type = payload.type
    this.isVariantable = payload.isVariantable
  }
}

export class ProductAssignedAttribute extends BaseEntity implements ProductAssignedAttributeEntity {
  productId: Guid
  attributeId: Guid
  isRequired: boolean
  isFilterable: boolean
  sortOrder: number

  constructor(payload: ProductAssignedAttributePayload) {
    super(payload)
    this.productId = payload.productId
    this.attributeId = payload.attributeId
    this.isRequired = payload.isRequired
    this.isFilterable = payload.isFilterable
    this.sortOrder = payload.sortOrder
  }
}

export class ProductAttributeOption extends BaseEntity implements ProductAttributeOptionEntity {
  productAssignedAttributeId: Guid
  value: string
  metaData?: Record<string, unknown> | null
  sortOrder: number

  constructor(payload: ProductAttributeOptionPayload) {
    super(payload)
    this.productAssignedAttributeId = payload.productAssignedAttributeId
    this.value = payload.value
    this.metaData = payload.metaData
    this.sortOrder = payload.sortOrder
  }
}

export class ProductSpecification extends BaseEntity implements ProductSpecificationEntity {
  productId: Guid
  attributeId: Guid
  value: string

  constructor(payload: ProductSpecificationPayload) {
    super(payload)
    this.productId = payload.productId
    this.attributeId = payload.attributeId
    this.value = payload.value
  }
}

export class ProductVariant extends BaseEntity implements ProductVariantEntity {
  productId: Guid
  sku: string
  priceOverride?: number | null
  stockQuantity: number
  imageUrl?: string | null
  isVisible: boolean

  constructor(payload: ProductVariantPayload) {
    super(payload)
    this.productId = payload.productId
    this.sku = payload.sku
    this.priceOverride = payload.priceOverride
    this.stockQuantity = payload.stockQuantity
    this.imageUrl = payload.imageUrl ?? null
    this.isVisible = payload.isVisible ?? true
  }

  changeStock(quantity: number): void {
    this.stockQuantity = quantity
    this.touch()
  }

  reserve(quantity: number): void {
    if (quantity > this.stockQuantity) throw new Error('Insufficient stock')
    this.stockQuantity -= quantity
    this.touch()
  }
}

export class VariantAttributeValue extends BaseEntity implements VariantAttributeValueEntity {
  variantId: Guid
  attributeId: Guid
  attributeOptionId: Guid

  constructor(payload: VariantAttributeValuePayload) {
    super(payload)
    this.variantId = payload.variantId
    this.attributeId = payload.attributeId
    this.attributeOptionId = payload.attributeOptionId
  }
}
