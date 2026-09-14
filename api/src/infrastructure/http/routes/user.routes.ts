import type { RouteOptions } from 'fastify'
import type { IUserService } from '../../../core/services/user.svc.js'
import * as ctrl from '../controllers/user.ctrl.js'
import * as s from '../schemas/user.schemas.js'

export const userRoutes = (service: IUserService): RouteOptions[] => [
  // Accounts are created only through Supabase Auth signup + POST /auth/sync.
  { method: 'GET',   url: '/users/me',                roles: ['Admin', 'User'], schema: s.getMeSchema,           handler: ctrl.getMe() },
  { method: 'GET',    url: '/users',                   roles: ['Admin'],         schema: s.listUsersSchema,       handler: ctrl.listUsers(service) },
  { method: 'GET',    url: '/users/:id',               roles: ['Admin', 'User'], schema: s.getUserSchema,         handler: ctrl.getUserById(service) },
  { method: 'PATCH',  url: '/users/:id',               roles: ['Admin', 'User'], schema: s.updateUserSchema,      handler: ctrl.updateUser(service) },
  { method: 'PATCH',  url: '/users/:id/role',          roles: ['Admin'],         schema: s.changeRoleSchema,      handler: ctrl.changeRole(service) },
  { method: 'POST',   url: '/users/:id/profile-image', roles: ['Admin', 'User'], schema: s.setProfileImageSchema, handler: ctrl.setProfileImage(service) },
  { method: 'DELETE', url: '/users/:id/profile-image', roles: ['Admin', 'User'], schema: s.removeProfileImageSchema, handler: ctrl.removeProfileImage(service) },
  { method: 'POST',   url: '/users/:id/activate',      roles: ['Admin'],         schema: s.activateUserSchema,    handler: ctrl.activateUser(service) },
  { method: 'DELETE', url: '/users/:id',               roles: ['Admin'],         schema: s.deactivateUserSchema,  handler: ctrl.deactivateUser(service) },
]
