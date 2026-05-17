import { type Attachment } from '../entities/attachment.js'
import { type Guid } from '../entities/base.js'

export interface UploadAttachmentInput {
  fileName: string
  mimeType: string
  data: Buffer
  uploadedBy: Guid
}

export interface IAttachmentService {
  uploadAttachment: (input: UploadAttachmentInput) => Promise<Attachment>
  getAttachmentById: (id: Guid) => Promise<Attachment | null>
  getAttachmentsByUser: (uploadedBy: Guid) => Promise<Attachment[]>
  renameAttachment: (id: Guid, fileName: string) => Promise<Attachment>
  replaceAttachmentFile: (id: Guid, input: Omit<UploadAttachmentInput, 'uploadedBy'>) => Promise<Attachment>
  deactivateAttachment: (id: Guid) => Promise<Attachment>
  deleteAttachment: (id: Guid) => Promise<void>
}
