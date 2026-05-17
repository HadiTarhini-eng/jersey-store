import { type Guid } from '../entities/base.js'
import { type User, type UserRole } from '../entities/user.js'

export interface IUserService {
  createUser: (user: User) => Promise<User>
  updateUser: (id: Guid, user: Partial<User>) => Promise<User>
  activateUser: (id: Guid) => Promise<User>
  deactivateUser: (id: Guid) => Promise<User>
  changePassword: (id: Guid, password: string) => Promise<User>
  changeRole: (id: Guid, role: UserRole | string) => Promise<User>
  setProfileImage: (id: Guid, profileImageId?: Guid | null) => Promise<User>
  getUserById: (id: Guid) => Promise<User | null>
  getUserByEmail: (email: string) => Promise<User | null>
  getAllUsers: () => Promise<User[]>
}
