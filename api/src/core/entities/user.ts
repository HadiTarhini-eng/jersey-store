import { HashPassword } from '../../utils/hash.js'
import { BaseEntity, type BusinessEntity, type BusinessEntityPayload, type Guid } from './base.js'

export type UserRole = 'Admin' | 'User'

export interface UserEntity extends BusinessEntity {
  firstName: string
  lastName: string
  email: string
  passwordHash: string
  phone?: string | null
  role: UserRole | string
  profileImageId?: Guid | null
}

export interface UserCreatePayload extends BusinessEntityPayload {
  firstName: string
  lastName: string
  email: string
  password?: string
  passwordHash?: string
  phone?: string | null
  role: UserRole | string
  profileImageId?: Guid | null
}

export class User extends BaseEntity implements UserEntity {
  firstName: string
  lastName: string
  email: string
  passwordHash: string
  phone?: string | null
  role: UserRole | string
  profileImageId?: Guid | null

  constructor(userPayload: UserCreatePayload) {
    super(userPayload)

    this.firstName = userPayload.firstName
    this.lastName = userPayload.lastName
    this.phone = userPayload.phone ?? null
    this.email = userPayload.email
    this.passwordHash = userPayload.passwordHash ?? HashPassword(userPayload.password ?? '')
    this.role = userPayload.role
    this.profileImageId = userPayload.profileImageId
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

  changePassword(password: string): void {
    this.passwordHash = HashPassword(password)
    this.touch()
  }

  changeRole(role: UserRole | string): void {
    this.role = role
    this.touch()
  }

  setProfileImage(profileImageId?: Guid | null): void {
    this.profileImageId = profileImageId
    this.touch()
  }
}
