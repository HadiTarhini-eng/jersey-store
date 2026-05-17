import { type Guid } from '../../core/entities/base.js'
import { type OfferProduct, SpecialOffer } from '../../core/entities/offer.js'
import { type IAttachmentService } from '../../core/services/attachment.svc.js'
import { type CreateOfferInput, type ISpecialOfferService } from '../../core/services/offer.svc.js'
import { type ImageFile } from '../../core/services/storage.svc.js'
import {
  type EntityRepository,
  type OfferProductRepository,
} from '../repositories/entity.repository.js'
import { ConflictError, ValidationError } from './errors.js'
import { assertAllowed, assertDateRange, assertGuid, assertNonNegativeNumber, assertRequiredString } from './validators.js'

const discountTypes = ['percentage', 'fixed_amount'] as const

export class SpecialOfferService implements ISpecialOfferService {
  constructor(
    private readonly offerRepository: EntityRepository<SpecialOffer>,
    private readonly offerProductRepository: OfferProductRepository,
    private readonly attachmentService: IAttachmentService,
  ) {}

  async createOffer(input: CreateOfferInput): Promise<SpecialOffer> {
    assertGuid(input.uploadedBy, 'uploadedBy')
    assertRequiredString(input.data.title, 'title')
    assertAllowed(input.data.discountType, discountTypes, 'discountType')
    this.validateDiscountValue(input.data.discountType, input.data.discountValue)
    assertDateRange(input.data.startDate, input.data.endDate)

    let bannerAttachmentId: Guid | null = null
    if (input.banner) {
      const attachment = await this.attachmentService.uploadAttachment({
        data: input.banner.data,
        fileName: input.banner.fileName,
        mimeType: input.banner.mimeType,
        uploadedBy: input.uploadedBy,
      })
      bannerAttachmentId = attachment.id
    }

    const offer = new SpecialOffer({ ...input.data, bannerAttachmentId })
    return this.offerRepository.create(offer)
  }

  async setOfferBanner(id: Guid, file: ImageFile, uploadedBy: Guid): Promise<SpecialOffer> {
    assertGuid(id)
    assertGuid(uploadedBy, 'uploadedBy')
    const offer = await this.offerRepository.require(id, 'Special offer')
    if (offer.bannerAttachmentId) {
      await this.attachmentService.deleteAttachment(offer.bannerAttachmentId).catch(() => undefined)
    }
    const attachment = await this.attachmentService.uploadAttachment({
      data: file.data,
      fileName: file.fileName,
      mimeType: file.mimeType,
      uploadedBy,
    })
    return this.offerRepository.update(id, { bannerAttachmentId: attachment.id } as Partial<SpecialOffer>)
  }

  async removeOfferBanner(id: Guid): Promise<SpecialOffer> {
    assertGuid(id)
    const offer = await this.offerRepository.require(id, 'Special offer')
    if (offer.bannerAttachmentId) {
      await this.attachmentService.deleteAttachment(offer.bannerAttachmentId).catch(() => undefined)
    }
    return this.offerRepository.update(id, { bannerAttachmentId: null } as Partial<SpecialOffer>)
  }

  async updateOffer(id: Guid, data: Partial<SpecialOffer>): Promise<SpecialOffer> {
    assertGuid(id)
    if (data.title !== undefined) assertRequiredString(data.title, 'title')
    if (data.discountType !== undefined) assertAllowed(data.discountType, discountTypes, 'discountType')
    if (data.discountValue !== undefined) this.validateDiscountValue(data.discountType ?? 'fixed_amount', data.discountValue)
    if (data.startDate !== undefined || data.endDate !== undefined) {
      const existing = await this.offerRepository.require(id, 'Special offer')
      assertDateRange(data.startDate ?? existing.startDate, data.endDate ?? existing.endDate)
    }
    if (data.bannerAttachmentId) assertGuid(data.bannerAttachmentId, 'bannerAttachmentId')
    return this.offerRepository.update(id, data)
  }

  async getOfferById(id: Guid): Promise<SpecialOffer | null> {
    assertGuid(id)
    return this.offerRepository.get(id)
  }

  async listActiveOffers(date = new Date()): Promise<SpecialOffer[]> {
    const offers = await this.offerRepository.list()
    return offers.filter((offer) => offer.isCurrentlyActive(date))
  }

  async listOffersForProduct(productId: Guid): Promise<SpecialOffer[]> {
    assertGuid(productId, 'productId')
    const offerIds = await this.offerProductRepository.listOfferIdsByProduct(productId)
    const offers = await Promise.all(offerIds.map((id) => this.offerRepository.get(id)))
    return offers.filter((offer): offer is SpecialOffer => Boolean(offer))
  }

  async attachProduct(offerProduct: OfferProduct): Promise<OfferProduct> {
    assertGuid(offerProduct.offerId, 'offerId')
    assertGuid(offerProduct.productId, 'productId')
    await this.offerRepository.require(offerProduct.offerId, 'Special offer')
    if (await this.offerProductRepository.exists(offerProduct.offerId, offerProduct.productId)) {
      throw new ConflictError('Product is already attached to this offer')
    }
    await this.offerProductRepository.create(offerProduct.offerId, offerProduct.productId)
    return offerProduct
  }

  async detachProduct(offerId: Guid, productId: Guid): Promise<void> {
    assertGuid(offerId, 'offerId')
    assertGuid(productId, 'productId')
    await this.offerProductRepository.delete(offerId, productId)
  }

  async rescheduleOffer(id: Guid, startDate: Date, endDate: Date): Promise<SpecialOffer> {
    assertGuid(id)
    assertDateRange(startDate, endDate)
    return this.offerRepository.update(id, { startDate, endDate } as Partial<SpecialOffer>)
  }

  async activateOffer(id: Guid): Promise<SpecialOffer> {
    assertGuid(id)
    const offer = await this.offerRepository.require(id, 'Special offer')
    if (offer.endDate < new Date()) throw new ValidationError('Expired offers cannot be activated')
    return this.offerRepository.update(id, { isActive: true } as Partial<SpecialOffer>)
  }

  async deactivateOffer(id: Guid): Promise<SpecialOffer> {
    assertGuid(id)
    return this.offerRepository.update(id, { isActive: false } as Partial<SpecialOffer>)
  }

  private validateDiscountValue(discountType: string, discountValue: number): void {
    assertNonNegativeNumber(discountValue, 'discountValue')
    if (discountValue === 0) throw new ValidationError('discountValue must be greater than 0')
    if (discountType === 'percentage' && discountValue > 100) throw new ValidationError('percentage discount cannot exceed 100')
  }
}
