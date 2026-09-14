import { HashPassword } from '../../utils/hash.js'
import { type AddressSnapshot } from './commerce.js'
import { BaseEntity, type BusinessEntity, type BusinessEntityPayload } from './base.js'

export type UserRole = 'Admin' | 'User'

export interface UserEntity extends BusinessEntity {
  firstName: string
  lastName: string
  email: string
  /** Legacy pbkdf2 hash — null for Supabase-authenticated accounts. */
  passwordHash: string | null
  /** Linked Supabase Auth user id (auth.users.id), null before linking. */
  supabaseUserId?: string | null
  phone?: string | null
  role: UserRole | string
  profileImageUrl?: string | null
  /** Saved default shipping address, or null when the user hasn't set one. */
  shippingAddress?: AddressSnapshot | null
}

export interface UserCreatePayload extends BusinessEntityPayload {
  firstName: string
  lastName: string
  email: string
  password?: string
  passwordHash?: string | null
  supabaseUserId?: string | null
  phone?: string | null
  role: UserRole | string
  profileImageUrl?: string | null
  shippingAddress?: AddressSnapshot | null
}

export class User extends BaseEntity implements UserEntity {
  firstName: string
  lastName: string
  email: string
  /** Legacy pbkdf2 hash — null for Supabase-authenticated accounts. */
  passwordHash: string | null
  /** Linked Supabase Auth user id (auth.users.id), null before linking. */
  supabaseUserId?: string | null
  phone?: string | null
  role: UserRole | string
  profileImageUrl?: string | null
  shippingAddress?: AddressSnapshot | null

  constructor(userPayload: UserCreatePayload) {
    super(userPayload)

    this.firstName = userPayload.firstName
    this.lastName = userPayload.lastName
    this.phone = userPayload.phone ?? null
    this.email = userPayload.email
    // Supabase-authenticated accounts carry no local hash at all.
    this.passwordHash = userPayload.passwordHash ?? (userPayload.password ? HashPassword(userPayload.password) : null)
    this.supabaseUserId = userPayload.supabaseUserId ?? null
    this.role = userPayload.role
    this.profileImageUrl = userPayload.profileImageUrl ?? null
    this.shippingAddress = userPayload.shippingAddress ?? null
  }

  rename(firstName: string, lastName: string): void {
    this.firstName = firstName
    this.lastName = lastName
    this.touch()
  }

  changeEmail(email: string): void {
    this.email = email
    this.touch()
  }

  linkSupabaseUser(supabaseUserId: string): void {
    this.supabaseUserId = supabaseUserId
    this.touch()
  }

  changePassword(password: string): void {
    this.passwordHash = HashPassword(password)
    this.touch()
  }

  changeRole(role: UserRole | string): void {
    this.role = role
    this.touch()
  }

  setProfileImage(profileImageUrl?: string | null): void {
    this.profileImageUrl = profileImageUrl ?? null
    this.touch()
  }
}
