import { BaseEntity, type BusinessEntity, type BusinessEntityPayload, type Guid } from './base.js'

/**
 * Product gallery image. Many attachments belong to one product, ordered by
 * `sortOrder` ascending — the first row is the product's primary/cover image.
 */
export interface AttachmentEntity extends BusinessEntity {
  productId: Guid
  fileName: string
  fileUrl: string
  compressedFileUrl?: string | null
  mimeType: string
  fileSize: number
  sortOrder: number
}

export interface AttachmentPayload extends BusinessEntityPayload {
  productId: Guid
  fileName: string
  fileUrl: string
  compressedFileUrl?: string | null
  mimeType: string
  fileSize: number
  sortOrder?: number
}

export class Attachment extends BaseEntity implements AttachmentEntity {
  productId: Guid
  fileName: string
  fileUrl: string
  compressedFileUrl?: string | null
  mimeType: string
  fileSize: number
  sortOrder: number

  constructor(payload: AttachmentPayload) {
    super(payload)
    this.productId = payload.productId
    this.fileName = payload.fileName
    this.fileUrl = payload.fileUrl
    this.compressedFileUrl = payload.compressedFileUrl ?? null
    this.mimeType = payload.mimeType
    this.fileSize = payload.fileSize
    this.sortOrder = payload.sortOrder ?? 0
  }

  rename(fileName: string): void {
    this.fileName = fileName
    this.touch()
  }

  reorder(sortOrder: number): void {
    this.sortOrder = sortOrder
    this.touch()
  }

  replaceFile(fileUrl: string, mimeType: string, fileSize: number, compressedFileUrl?: string | null): void {
    this.fileUrl = fileUrl
    this.mimeType = mimeType
    this.fileSize = fileSize
    if (compressedFileUrl !== undefined) this.compressedFileUrl = compressedFileUrl
    this.touch()
  }
}
