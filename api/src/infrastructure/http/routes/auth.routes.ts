import type { RouteOptions } from 'fastify'
import type { IUserService } from '../../../core/services/user.svc.js'
import * as ctrl from '../controllers/auth.ctrl.js'
import * as s from '../schemas/auth.schemas.js'

/**
 * Supabase Auth owns credentials, verification and sessions. The only auth
 * endpoint the API exposes links a verified Supabase identity to its
 * application profile — it runs with `tokenOnly` because the profile may not
 * exist yet at that point.
 */
export const authRoutes = (service: IUserService): RouteOptions[] => [
  { method: 'POST', url: '/auth/sync', tokenOnly: true, schema: s.syncSchema, handler: ctrl.syncCurrentUser(service) },
]
