import { BaseEntity, type BusinessEntity, type BusinessEntityPayload, type Guid } from './base.js'

export interface AttachmentEntity extends BusinessEntity {
  fileName: string
  fileUrl: string
  compressedFileUrl?: string | null
  mimeType: string
  fileSize: number
  uploadedBy: Guid
}

export interface AttachmentPayload extends BusinessEntityPayload {
  fileName: string
  fileUrl: string
  compressedFileUrl?: string | null
  mimeType: string
  fileSize: number
  uploadedBy: Guid
}

export class Attachment extends BaseEntity implements AttachmentEntity {
  fileName: string
  fileUrl: string
  compressedFileUrl?: string | null
  mimeType: string
  fileSize: number
  uploadedBy: Guid

  constructor(payload: AttachmentPayload) {
    super(payload)
    this.fileName = payload.fileName
    this.fileUrl = payload.fileUrl
    this.compressedFileUrl = payload.compressedFileUrl ?? null
    this.mimeType = payload.mimeType
    this.fileSize = payload.fileSize
    this.uploadedBy = payload.uploadedBy
  }

  rename(fileName: string): void {
    this.fileName = fileName
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
