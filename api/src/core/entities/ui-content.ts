import { BaseEntity, type BusinessEntity, type BusinessEntityPayload } from './base.js'

export type UiContentSlot =
  | 'hero-slide'
  | 'offer-banner'
  | 'offer-strip'
  | 'sport'
  | 'team'
  | 'kit-category'
  | 'nav-link'
  | 'footer-column'
  | 'featured-section'
  | 'product-perk'
  | 'coupon'

export interface UiContentEntity extends BusinessEntity {
  slot: UiContentSlot
  payload: Record<string, unknown>
  imageUrl?: string | null
  sortOrder: number
}

export type UiContentPayload = BusinessEntityPayload & Omit<UiContentEntity, keyof BusinessEntity>

export class UiContent extends BaseEntity implements UiContentEntity {
  slot: UiContentSlot
  payload: Record<string, unknown>
  imageUrl?: string | null
  sortOrder: number

  constructor(input: UiContentPayload) {
    super(input)
    this.slot = input.slot
    this.payload = input.payload ?? {}
    this.imageUrl = input.imageUrl ?? null
    this.sortOrder = input.sortOrder ?? 0
  }

  setImage(imageUrl?: string | null): void {
    this.imageUrl = imageUrl ?? null
    this.touch()
  }

  reorder(sortOrder: number): void {
    this.sortOrder = sortOrder
    this.touch()
  }
}
