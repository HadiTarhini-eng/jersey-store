import { type Attachment } from '../../core/entities/attachment.js'
import { type Guid } from '../../core/entities/base.js'
import { type IAttachmentService } from '../../core/services/attachment.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ConflictError } from './errors.js'
import { assertGuid, assertNonNegativeNumber, assertRequiredString } from './validators.js'

export class AttachmentService implements IAttachmentService {
  constructor(
    private readonly attachmentsRepository: EntityRepository<Attachment>,
  ) {}

  async createAttachment(attachment: Attachment): Promise<Attachment> {
    this.validateAttachment(attachment)
    if (await this.attachmentsRepository.get(attachment.id)) throw new ConflictError('Attachment id already exists')
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

  async replaceAttachmentFile(id: Guid, fileUrl: string, mimeType: string, fileSize: number): Promise<Attachment> {
    assertGuid(id)
    assertRequiredString(fileUrl, 'fileUrl', 2048)
    assertRequiredString(mimeType, 'mimeType', 100)
    assertNonNegativeNumber(fileSize, 'fileSize')
    return this.attachmentsRepository.update(id, { fileUrl, mimeType, fileSize } as Partial<Attachment>)
  }

  async deactivateAttachment(id: Guid): Promise<Attachment> {
    assertGuid(id)
    return this.attachmentsRepository.update(id, { isActive: false } as Partial<Attachment>)
  }

  async deleteAttachment(id: Guid): Promise<void> {
    assertGuid(id)
    await this.attachmentsRepository.require(id, 'Attachment')
    await this.attachmentsRepository.delete(id)
  }

  private validateAttachment(attachment: Attachment): void {
    assertGuid(attachment.id)
    assertGuid(attachment.uploadedBy, 'uploadedBy')
    assertRequiredString(attachment.fileName, 'fileName')
    assertRequiredString(attachment.fileUrl, 'fileUrl', 2048)
    assertRequiredString(attachment.mimeType, 'mimeType', 100)
    assertNonNegativeNumber(attachment.fileSize, 'fileSize')
  }
}
