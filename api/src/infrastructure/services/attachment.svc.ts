import { Attachment } from '../../core/entities/attachment.js'
import { type Guid } from '../../core/entities/base.js'
import { type IAttachmentService, type UploadAttachmentInput } from '../../core/services/attachment.svc.js'
import { type ImageFile, type IStorageService } from '../../core/services/storage.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { deleteInlineImage, uploadProductImage } from './image.svc.js'
import { assertGuid, assertRequiredString } from './validators.js'

/**
 * Manages the product gallery. Each Attachment belongs to exactly one product
 * (FK `productId`), ordered by `sortOrder`. The lowest sortOrder = primary
 * cover image.
 *
 * Single-image uploads for other entities use the inline-URL helpers in
 * `image.svc.ts` directly — they don't go through this service.
 */
export class AttachmentService implements IAttachmentService {
  constructor(
    private readonly repository: EntityRepository<Attachment>,
    private readonly storage: IStorageService,
  ) {}

  async uploadForProduct(input: UploadAttachmentInput): Promise<Attachment> {
    assertGuid(input.productId, 'productId')

    const uploaded = await uploadProductImage(this.storage, input.file)
    try {
      const compressedUrl = uploaded.fileUrl !== uploaded.originalUrl ? uploaded.fileUrl : null
      const attachment = new Attachment({
        productId: input.productId,
        fileName: input.file.fileName,
        fileUrl: uploaded.originalUrl ?? uploaded.fileUrl,
        compressedFileUrl: compressedUrl,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        sortOrder: input.sortOrder ?? 0,
      })
      return await this.repository.create(attachment)
    } catch (err) {
      // Storage succeeded but DB insert failed — roll back the storage upload.
      await this.storage.delete(uploaded.paths).catch(() => undefined)
      throw err
    }
  }

  async getById(id: Guid): Promise<Attachment | null> {
    assertGuid(id)
    return this.repository.get(id)
  }

  async listByProduct(productId: Guid): Promise<Attachment[]> {
    assertGuid(productId, 'productId')
    const rows = await this.repository.listBy('productId', productId)
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async rename(id: Guid, fileName: string): Promise<Attachment> {
    assertGuid(id)
    assertRequiredString(fileName, 'fileName')
    return this.repository.update(id, { fileName } as Partial<Attachment>)
  }

  async reorder(id: Guid, sortOrder: number): Promise<Attachment> {
    assertGuid(id)
    return this.repository.update(id, { sortOrder } as Partial<Attachment>)
  }

  async replaceFile(id: Guid, file: ImageFile): Promise<Attachment> {
    assertGuid(id)
    const existing = await this.repository.require(id, 'Attachment')

    // Delete the old storage objects best-effort.
    await deleteInlineImage(this.storage, existing.fileUrl).catch(() => undefined)
    if (existing.compressedFileUrl) {
      await deleteInlineImage(this.storage, existing.compressedFileUrl).catch(() => undefined)
    }

    const uploaded = await uploadProductImage(this.storage, file)
    return this.repository.update(id, {
      fileName: file.fileName,
      fileUrl: uploaded.originalUrl ?? uploaded.fileUrl,
      compressedFileUrl: uploaded.fileUrl !== uploaded.originalUrl ? uploaded.fileUrl : null,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.fileSize,
    } as Partial<Attachment>)
  }

  async delete(id: Guid): Promise<void> {
    assertGuid(id)
    const existing = await this.repository.require(id, 'Attachment')
    await deleteInlineImage(this.storage, existing.fileUrl).catch(() => undefined)
    if (existing.compressedFileUrl) {
      await deleteInlineImage(this.storage, existing.compressedFileUrl).catch(() => undefined)
    }
    await this.repository.delete(id)
  }

  async deleteAllForProduct(productId: Guid): Promise<void> {
    assertGuid(productId, 'productId')
    const rows = await this.repository.listBy('productId', productId)
    await Promise.all(rows.map((row) => this.delete(row.id).catch(() => undefined)))
  }
}
