import { type Guid } from '../entities/base.js'
import { type OfferProduct, type SpecialOffer } from '../entities/offer.js'

export interface ISpecialOfferService {
  createOffer: (offer: SpecialOffer) => Promise<SpecialOffer>
  updateOffer: (id: Guid, data: Partial<SpecialOffer>) => Promise<SpecialOffer>
  getOfferById: (id: Guid) => Promise<SpecialOffer | null>
  listActiveOffers: (date?: Date) => Promise<SpecialOffer[]>
  listOffersForProduct: (productId: Guid) => Promise<SpecialOffer[]>
  attachProduct: (offerProduct: OfferProduct) => Promise<OfferProduct>
  detachProduct: (offerId: Guid, productId: Guid) => Promise<void>
  rescheduleOffer: (id: Guid, startDate: Date, endDate: Date) => Promise<SpecialOffer>
  activateOffer: (id: Guid) => Promise<SpecialOffer>
  deactivateOffer: (id: Guid) => Promise<SpecialOffer>
}
