import { BaseEntity, type BusinessEntity, type BusinessEntityPayload, type Guid } from './base.js'

export interface CategoryTypeEntity extends BusinessEntity {
  name: string
  slug: string
  description?: string | null
}

export interface CategoryEntity extends BusinessEntity {
  categoryTypeId: Guid
  parentId?: Guid | null
  name: string
  slug: string
  description?: string | null
  imageId?: Guid | null
}

export interface CategoryTypePayload extends BusinessEntityPayload {
  name: string
  slug: string
  description?: string | null
}

export interface CategoryPayload extends BusinessEntityPayload {
  categoryTypeId: Guid
  parentId?: Guid | null
  name: string
  slug: string
  description?: string | null
  imageId?: Guid | null
}

export class CategoryType extends BaseEntity implements CategoryTypeEntity {
  name: string
  slug: string
  description?: string | null

  constructor(payload: CategoryTypePayload) {
    super(payload)
    this.name = payload.name
    this.slug = payload.slug
    this.description = payload.description
  }

  updateDetails(name: string, slug: string, description?: string | null): void {
    this.name = name
    this.slug = slug
    this.description = description
    this.touch()
  }
}

export class Category extends BaseEntity implements CategoryEntity {
  categoryTypeId: Guid
  parentId?: Guid | null
  name: string
  slug: string
  description?: string | null
  imageId?: Guid | null

  constructor(payload: CategoryPayload) {
    super(payload)
    this.categoryTypeId = payload.categoryTypeId
    this.parentId = payload.parentId
    this.name = payload.name
    this.slug = payload.slug
    this.description = payload.description
    this.imageId = payload.imageId
  }

  updateDetails(name: string, slug: string, description?: string | null): void {
    this.name = name
    this.slug = slug
    this.description = description
    this.touch()
  }

  moveTo(parentId?: Guid | null): void {
    this.parentId = parentId
    this.touch()
  }

  setImage(imageId?: Guid | null): void {
    this.imageId = imageId
    this.touch()
  }
}
