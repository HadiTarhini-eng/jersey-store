import { type Guid } from '../entities/base.js'
import { type OfferProduct, type SpecialOffer, type SpecialOfferPayload } from '../entities/offer.js'
import { type ImageFile } from './storage.svc.js'

export interface CreateOfferInput {
  data: Omit<SpecialOfferPayload, 'bannerAttachmentId'>
  uploadedBy: Guid
  banner?: ImageFile
}

export interface ISpecialOfferService {
  createOffer: (input: CreateOfferInput) => Promise<SpecialOffer>
  updateOffer: (id: Guid, data: Partial<SpecialOffer>) => Promise<SpecialOffer>
  getOfferById: (id: Guid) => Promise<SpecialOffer | null>
  listActiveOffers: (date?: Date) => Promise<SpecialOffer[]>
  listOffersForProduct: (productId: Guid) => Promise<SpecialOffer[]>
  attachProduct: (offerProduct: OfferProduct) => Promise<OfferProduct>
  detachProduct: (offerId: Guid, productId: Guid) => Promise<void>
  rescheduleOffer: (id: Guid, startDate: Date, endDate: Date) => Promise<SpecialOffer>
  setOfferBanner: (id: Guid, file: ImageFile, uploadedBy: Guid) => Promise<SpecialOffer>
  removeOfferBanner: (id: Guid) => Promise<SpecialOffer>
  activateOffer: (id: Guid) => Promise<SpecialOffer>
  deactivateOffer: (id: Guid) => Promise<SpecialOffer>
}
