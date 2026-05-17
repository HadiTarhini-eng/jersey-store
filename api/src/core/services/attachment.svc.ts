import { type Attachment } from '../entities/attachment.js'
import { type Guid } from '../entities/base.js'

export interface IAttachmentService {
  createAttachment: (attachment: Attachment) => Promise<Attachment>
  getAttachmentById: (id: Guid) => Promise<Attachment | null>
  getAttachmentsByUser: (uploadedBy: Guid) => Promise<Attachment[]>
  renameAttachment: (id: Guid, fileName: string) => Promise<Attachment>
  replaceAttachmentFile: (id: Guid, fileUrl: string, mimeType: string, fileSize: number) => Promise<Attachment>
  deactivateAttachment: (id: Guid) => Promise<Attachment>
  deleteAttachment: (id: Guid) => Promise<void>
}
