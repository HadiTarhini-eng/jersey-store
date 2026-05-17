import { type Guid } from '../../core/entities/base.js'
import { User, type UserRole } from '../../core/entities/user.js'
import { type IAttachmentService } from '../../core/services/attachment.svc.js'
import { type ImageFile } from '../../core/services/storage.svc.js'
import { type IUserService } from '../../core/services/user.svc.js'
import { HashPassword } from '../../utils/hash.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ConflictError, ValidationError } from './errors.js'
import { assertEmail, assertGuid, assertRequiredString } from './validators.js'

const allowedRoles = ['Admin', 'User'] as const

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: EntityRepository<User>,
    private readonly attachmentService: IAttachmentService,
  ) {}

  async createUser(user: User): Promise<User> {
    this.validateUser(user)
    const existing = await this.getUserByEmail(user.email)
    if (existing) throw new ConflictError('Email already exists')
    return this.userRepository.create(user)
  }

  async updateUser(id: Guid, user: Partial<User>): Promise<User> {
    assertGuid(id)
    if (user.firstName !== undefined) assertRequiredString(user.firstName, 'firstName')
    if (user.lastName !== undefined) assertRequiredString(user.lastName, 'lastName')
    if (user.phone !== undefined) assertRequiredString(user.phone, 'phone', 40)
    if (user.email !== undefined) {
      assertEmail(user.email)
      const existing = await this.getUserByEmail(user.email)
      if (existing && existing.id !== id) throw new ConflictError('Email already exists')
    }
    if (user.role !== undefined) this.assertRole(user.role)
    return this.userRepository.update(id, user)
  }

  async activateUser(id: Guid): Promise<User> {
    assertGuid(id)
    return this.userRepository.update(id, { isActive: true } as Partial<User>)
  }

  async deactivateUser(id: Guid): Promise<User> {
    assertGuid(id)
    return this.userRepository.update(id, { isActive: false } as Partial<User>)
  }

  async changePassword(id: Guid, password: string): Promise<User> {
    assertGuid(id)
    this.assertPassword(password)
    return this.userRepository.update(id, { passwordHash: HashPassword(password) } as Partial<User>)
  }

  async changeRole(id: Guid, role: UserRole | string): Promise<User> {
    this.assertRole(role)
    return this.updateUser(id, { role })
  }

  async setProfileImage(id: Guid, file: ImageFile): Promise<User> {
    assertGuid(id)
    const user = await this.userRepository.require(id, 'User')
    if (user.profileImageId) {
      await this.attachmentService.deleteAttachment(user.profileImageId).catch(() => undefined)
    }
    const attachment = await this.attachmentService.uploadAttachment({
      data: file.data,
      fileName: file.fileName,
      mimeType: file.mimeType,
      uploadedBy: id,
    })
    return this.userRepository.update(id, { profileImageId: attachment.id } as Partial<User>)
  }

  async removeProfileImage(id: Guid): Promise<User> {
    assertGuid(id)
    const user = await this.userRepository.require(id, 'User')
    if (user.profileImageId) {
      await this.attachmentService.deleteAttachment(user.profileImageId).catch(() => undefined)
    }
    return this.userRepository.update(id, { profileImageId: null } as Partial<User>)
  }

  async getUserById(id: Guid): Promise<User | null> {
    assertGuid(id)
    return this.userRepository.get(id)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    assertEmail(email)
    return this.userRepository.findBy('email', email)
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.list()
  }

  private validateUser(user: User): void {
    assertGuid(user.id)
    assertRequiredString(user.firstName, 'firstName')
    assertRequiredString(user.lastName, 'lastName')
    assertEmail(user.email)
    assertRequiredString(user.phone, 'phone', 40)
    assertRequiredString(user.passwordHash, 'passwordHash')
    this.assertRole(user.role)
  }

  private assertRole(role: UserRole | string): void {
    if (!allowedRoles.includes(role as 'Admin' | 'User')) throw new ValidationError('role is invalid')
  }

  private assertPassword(password: string): void {
    assertRequiredString(password, 'password', 128)
    if (password.length < 8) throw new ValidationError('password must be at least 8 characters')
  }
}
