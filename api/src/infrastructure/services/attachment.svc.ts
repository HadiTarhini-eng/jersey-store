import crypto from 'crypto'
import { Attachment } from '../../core/entities/attachment.js'
import { type Guid } from '../../core/entities/base.js'
import { type IAttachmentService, type UploadAttachmentInput } from '../../core/services/attachment.svc.js'
import { type IStorageService } from '../../core/services/storage.svc.js'
import { compressImage } from '../../utils/image-compress.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ValidationError } from './errors.js'
import { assertGuid, assertRequiredString } from './validators.js'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 2 * 1024 * 1024

const extFromMime = (mimeType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[mimeType] ?? 'bin'
}

const originalPath = (id: Guid, mimeType: string) => `originals/${id}.${extFromMime(mimeType)}`
const compressedPath = (id: Guid) => `compressed/${id}.webp`

export class AttachmentService implements IAttachmentService {
  constructor(
    private readonly attachmentsRepository: EntityRepository<Attachment>,
    private readonly storage: IStorageService,
  ) {}

  async uploadAttachment(input: UploadAttachmentInput): Promise<Attachment> {
    this.validateUploadInput(input)

    const id = crypto.randomUUID()
    const original = await this.storage.upload(originalPath(id, input.mimeType), input.data, input.mimeType)

    const compressed = await compressImage(input.data)
    const compressedUpload = await this.storage.upload(compressedPath(id), compressed.data, compressed.mimeType)

    const attachment = new Attachment({
      id,
      fileName: input.fileName,
      fileUrl: original.url,
      compressedFileUrl: compressedUpload.url,
      mimeType: input.mimeType,
      fileSize: input.data.length,
      uploadedBy: input.uploadedBy,
    })

    return this.attachmentsRepository.create(attachment)
  }

  async getAttachmentById(id: Guid): Promise<Attachment | null> {
    assertGuid(id)
    return this.attachmentsRepository.get(id)
  }

  async getAttachmentsByUser(uploadedBy: Guid): Promise<Attachment[]> {
    assertGuid(uploadedBy, 'uploadedBy')
    return this.attachmentsRepository.listBy('uploadedBy', uploadedBy)
  }

  async renameAttachment(id: Guid, fileName: string): Promise<Attachment> {
    assertGuid(id)
    assertRequiredString(fileName, 'fileName')
    return this.attachmentsRepository.update(id, { fileName } as Partial<Attachment>)
  }

  async replaceAttachmentFile(id: Guid, input: Omit<UploadAttachmentInput, 'uploadedBy'>): Promise<Attachment> {
    assertGuid(id)
    const existing = await this.attachmentsRepository.require(id, 'Attachment')
    this.validateFileInput(input)

    await this.storage.delete([
      originalPath(existing.id, existing.mimeType),
      compressedPath(existing.id),
    ])

    const original = await this.storage.upload(originalPath(id, input.mimeType), input.data, input.mimeType)

    const compressed = await compressImage(input.data)
    const compressedUpload = await this.storage.upload(compressedPath(id), compressed.data, compressed.mimeType)

    return this.attachmentsRepository.update(id, {
      fileName: input.fileName,
      fileUrl: original.url,
      compressedFileUrl: compressedUpload.url,
      mimeType: input.mimeType,
      fileSize: input.data.length,
    } as Partial<Attachment>)
  }

  async deactivateAttachment(id: Guid): Promise<Attachment> {
    assertGuid(id)
    return this.attachmentsRepository.update(id, { isActive: false } as Partial<Attachment>)
  }

  async deleteAttachment(id: Guid): Promise<void> {
    assertGuid(id)
    const existing = await this.attachmentsRepository.require(id, 'Attachment')
    await this.storage.delete([
      originalPath(existing.id, existing.mimeType),
      compressedPath(existing.id),
    ])
    await this.attachmentsRepository.delete(id)
  }

  private validateUploadInput(input: UploadAttachmentInput): void {
    assertGuid(input.uploadedBy, 'uploadedBy')
    this.validateFileInput(input)
  }

  private validateFileInput(input: { fileName: string; mimeType: string; data: Buffer }): void {
    assertRequiredString(input.fileName, 'fileName')
    assertRequiredString(input.mimeType, 'mimeType', 100)
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError(`Unsupported file type: ${input.mimeType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`)
    }
    if (!input.data || input.data.length === 0) {
      throw new ValidationError('Uploaded file is empty')
    }
    if (input.data.length > MAX_BYTES) {
      throw new ValidationError(`File too large: ${input.data.length} bytes. Max: ${MAX_BYTES} bytes (2 MB)`)
    }
  }
}
