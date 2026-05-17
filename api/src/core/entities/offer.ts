import { BaseEntity, type BusinessEntity, type BusinessEntityPayload, type Guid } from './base.js'

export type DiscountType = 'percentage' | 'fixed_amount'

export interface SpecialOfferEntity extends BusinessEntity {
  title: string
  description?: string | null
  discountType: DiscountType
  discountValue: number
  startDate: Date
  endDate: Date
  bannerAttachmentId?: Guid | null
}

export interface OfferProduct {
  offerId: Guid
  productId: Guid
}

export type SpecialOfferPayload = BusinessEntityPayload & Omit<SpecialOfferEntity, keyof BusinessEntity>

export class SpecialOffer extends BaseEntity implements SpecialOfferEntity {
  title: string
  description?: string | null
  discountType: DiscountType
  discountValue: number
  startDate: Date
  endDate: Date
  bannerAttachmentId?: Guid | null

  constructor(payload: SpecialOfferPayload) {
    super(payload)
    this.title = payload.title
    this.description = payload.description
    this.discountType = payload.discountType
    this.discountValue = payload.discountValue
    this.startDate = payload.startDate
    this.endDate = payload.endDate
    this.bannerAttachmentId = payload.bannerAttachmentId
  }

  isCurrentlyActive(date = new Date()): boolean {
    return this.isActive && this.startDate <= date && this.endDate >= date
  }

  applyTo(amount: number): number {
    if (this.discountType === 'percentage') return amount * (1 - this.discountValue / 100)
    return Math.max(0, amount - this.discountValue)
  }

  reschedule(startDate: Date, endDate: Date): void {
    this.startDate = startDate
    this.endDate = endDate
    this.touch()
  }
}
