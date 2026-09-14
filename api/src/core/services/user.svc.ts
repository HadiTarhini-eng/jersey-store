import { type Guid } from '../entities/base.js'
import { type User, type UserRole } from '../entities/user.js'
import { type ImageFile } from './storage.svc.js'

/** Verified Supabase Auth identity — never assembled from request input. */
export interface SupabaseUserIdentity {
  supabaseUserId: Guid
  email: string
}

/** Profile fields collected at signup; only used when creating a new row. */
export interface SupabaseUserProfile {
  firstName?: string
  lastName?: string
  phone?: string | null
}

export interface IUserService {
  createUser: (user: User) => Promise<User>
  /**
   * Resolves the application profile for a verified Supabase Auth user by
   * `supabaseUserId`, creating a `User`-role row on first sign-in.
   */
  syncSupabaseUser: (identity: SupabaseUserIdentity, profile?: SupabaseUserProfile) => Promise<User>
  updateUser: (id: Guid, user: Partial<User>) => Promise<User>
  activateUser: (id: Guid) => Promise<User>
  deactivateUser: (id: Guid) => Promise<User>
  changeRole: (id: Guid, role: UserRole | string) => Promise<User>
  setProfileImage: (id: Guid, file: ImageFile) => Promise<User>
  removeProfileImage: (id: Guid) => Promise<User>
  getUserById: (id: Guid) => Promise<User | null>
  getUserByEmail: (email: string) => Promise<User | null>
  getAllUsers: () => Promise<User[]>
}
