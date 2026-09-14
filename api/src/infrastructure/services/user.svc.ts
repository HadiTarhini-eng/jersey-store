import { type Guid } from '../../core/entities/base.js'
import { User, type UserRole } from '../../core/entities/user.js'
import { type ImageFile, type IStorageService } from '../../core/services/storage.svc.js'
import {
  type IUserService,
  type SupabaseUserIdentity,
  type SupabaseUserProfile,
} from '../../core/services/user.svc.js'
import { type EntityRepository } from '../repositories/entity.repository.js'
import { ConflictError, ValidationError } from './errors.js'
import { deleteInlineImage, uploadInlineImage } from './image.svc.js'
import { assertEmail, assertGuid, assertRequiredString } from './validators.js'

const allowedRoles = ['Admin', 'User'] as const

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: EntityRepository<User>,
    private readonly storage: IStorageService,
  ) {}

  async createUser(user: User): Promise<User> {
    this.validateUser(user)
    const existing = await this.getUserByEmail(user.email)
    if (existing) throw new ConflictError('Email already exists')
    return this.userRepository.create(user)
  }

  /**
   * First contact for a Supabase-authenticated caller. The identity argument is
   * always the JWKS-verified token subject plus the email the Supabase Admin API
   * reports for it — never anything the client sent.
   *
   * The link is `supabase_user_id` only. An existing row is never adopted by
   * email: if an unlinked (or differently linked) row already holds the address,
   * the call fails closed with 409 rather than handing that row — and its role —
   * to whoever controls the Supabase account.
   */
  async syncSupabaseUser(
    identity: SupabaseUserIdentity,
    profile: SupabaseUserProfile = {},
  ): Promise<User> {
    assertGuid(identity.supabaseUserId)
    assertEmail(identity.email)
    const email = identity.email.toLowerCase()

    const linked = await this.userRepository.findBy('supabaseUserId', identity.supabaseUserId)
    if (linked) {
      // Keep the profile email in step with the verified Supabase address.
      if (linked.email.toLowerCase() !== email) {
        const holder = await this.getUserByEmail(email)
        if (holder && holder.id !== linked.id) {
          throw new ConflictError('This email is already used by another account')
        }
        return this.userRepository.update(linked.id, { email } as Partial<User>)
      }
      return linked
    }

    if (await this.getUserByEmail(email)) {
      throw new ConflictError('This email is already used by another account')
    }

    const user = new User({
      firstName: profile.firstName?.trim() || email.split('@')[0]!,
      lastName: profile.lastName?.trim() || '-',
      email,
      phone: profile.phone ?? null,
      // Role is always the default here — elevation only happens through
      // changeRole, which is Admin-only.
      role: 'User',
      supabaseUserId: identity.supabaseUserId,
    })
    try {
      return await this.createUser(user)
    } catch (err) {
      // Two first-contact requests can race (the callback page and the auth
      // state listener both sync). The loser hits a unique constraint — hand it
      // the row the winner created for the same Supabase identity.
      const created = await this.userRepository.findBy('supabaseUserId', identity.supabaseUserId)
      if (created) return created
      throw err
    }
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

  async changeRole(id: Guid, role: UserRole | string): Promise<User> {
    this.assertRole(role)
    return this.updateUser(id, { role })
  }

  async setProfileImage(id: Guid, file: ImageFile): Promise<User> {
    assertGuid(id)
    const user = await this.userRepository.require(id, 'User')
    await deleteInlineImage(this.storage, user.profileImageUrl)
    const uploaded = await uploadInlineImage(this.storage, file)
    return this.userRepository.update(id, { profileImageUrl: uploaded.url } as Partial<User>)
  }

  async removeProfileImage(id: Guid): Promise<User> {
    assertGuid(id)
    const user = await this.userRepository.require(id, 'User')
    await deleteInlineImage(this.storage, user.profileImageUrl)
    return this.userRepository.update(id, { profileImageUrl: null } as Partial<User>)
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
    if (user.phone !== null && user.phone !== undefined) assertRequiredString(user.phone, 'phone', 40)
    // Supabase-authenticated accounts hold no local password hash at all.
    if (!user.supabaseUserId) assertRequiredString(user.passwordHash ?? '', 'passwordHash')
    this.assertRole(user.role)
  }

  private assertRole(role: UserRole | string): void {
    if (!allowedRoles.includes(role as 'Admin' | 'User')) throw new ValidationError('role is invalid')
  }

}
