import { type Guid } from '../../core/entities/base.js'
import { UiContent, type UiContentSlot } from '../../core/entities/ui-content.js'
import {
  type CreateUiContentInput,
  type IUiContentService,
  type UpdateUiContentInput,
} from '../../core/services/ui-content.svc.js'
import { type ImageFile, type IStorageService } from '../../core/services/storage.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ValidationError } from './errors.js'
import { deleteInlineImage, uploadInlineImage } from './image.svc.js'
import { assertGuid } from './validators.js'

const SLOTS: readonly UiContentSlot[] = [
  'hero-slide',
  'offer-banner',
  'offer-strip',
  'sport',
  'team',
  'kit-category',
  'nav-link',
  'footer-column',
  'featured-section',
  'coupon',
]

function assertSlot(slot: string): asserts slot is UiContentSlot {
  if (!SLOTS.includes(slot as UiContentSlot)) throw new ValidationError(`Unknown ui-content slot: ${slot}`)
}

export class UiContentService implements IUiContentService {
  constructor(
    private readonly repository: EntityRepository<UiContent>,
    private readonly storage: IStorageService,
  ) {}

  async create(input: CreateUiContentInput): Promise<UiContent> {
    assertGuid(input.uploadedBy, 'uploadedBy')
    assertSlot(input.slot)

    let imageUrl: string | null = null
    if (input.image) {
      const uploaded = await uploadInlineImage(this.storage, input.image)
      imageUrl = uploaded.url
    }

    const entity = new UiContent({
      slot: input.slot,
      payload: input.payload ?? {},
      sortOrder: input.sortOrder ?? 0,
      imageUrl,
    })
    return this.repository.create(entity)
  }

  async listBySlot(slot: UiContentSlot, filters: { isActive?: boolean } = {}): Promise<UiContent[]> {
    assertSlot(slot)
    const rows = await this.repository.listBy('slot', slot)
    const filtered = filters.isActive === undefined
      ? rows
      : rows.filter((row) => row.isActive === filters.isActive)
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async getById(id: Guid): Promise<UiContent | null> {
    assertGuid(id)
    return this.repository.get(id)
  }

  async update(id: Guid, data: UpdateUiContentInput): Promise<UiContent> {
    assertGuid(id)
    return this.repository.update(id, data as Partial<UiContent>)
  }

  async setImage(id: Guid, file: ImageFile, uploadedBy: Guid): Promise<UiContent> {
    assertGuid(id)
    assertGuid(uploadedBy, 'uploadedBy')
    const existing = await this.repository.require(id, 'UI content')
    await deleteInlineImage(this.storage, existing.imageUrl)
    const uploaded = await uploadInlineImage(this.storage, file)
    return this.repository.update(id, { imageUrl: uploaded.url } as Partial<UiContent>)
  }

  async removeImage(id: Guid): Promise<UiContent> {
    assertGuid(id)
    const existing = await this.repository.require(id, 'UI content')
    await deleteInlineImage(this.storage, existing.imageUrl)
    return this.repository.update(id, { imageUrl: null } as Partial<UiContent>)
  }

  async reorder(id: Guid, sortOrder: number): Promise<UiContent> {
    assertGuid(id)
    return this.repository.update(id, { sortOrder } as Partial<UiContent>)
  }

  async activate(id: Guid): Promise<UiContent> {
    assertGuid(id)
    return this.repository.update(id, { isActive: true } as Partial<UiContent>)
  }

  async deactivate(id: Guid): Promise<UiContent> {
    assertGuid(id)
    return this.repository.update(id, { isActive: false } as Partial<UiContent>)
  }

  async delete(id: Guid): Promise<void> {
    assertGuid(id)
    const existing = await this.repository.require(id, 'UI content')
    await deleteInlineImage(this.storage, existing.imageUrl)
    await this.repository.delete(id)
  }
}

export { assertSlot, SLOTS }
