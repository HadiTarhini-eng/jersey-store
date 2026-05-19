import { type Attachment } from '../entities/attachment.js'
import { type Guid } from '../entities/base.js'
import { type ImageFile } from './storage.svc.js'

export interface UploadAttachmentInput {
  productId: Guid
  file: ImageFile
  sortOrder?: number
}

export interface IAttachmentService {
  uploadForProduct: (input: UploadAttachmentInput) => Promise<Attachment>
  getById: (id: Guid) => Promise<Attachment | null>
  listByProduct: (productId: Guid) => Promise<Attachment[]>
  rename: (id: Guid, fileName: string) => Promise<Attachment>
  reorder: (id: Guid, sortOrder: number) => Promise<Attachment>
  replaceFile: (id: Guid, file: ImageFile) => Promise<Attachment>
  delete: (id: Guid) => Promise<void>
  deleteAllForProduct: (productId: Guid) => Promise<void>
}
