import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IUserService } from '../../../core/services/user.svc.js'
import { ServiceError } from '../../services/errors.js'
import { sendOk } from '../routes/route-utils.js'
import type { SyncBodyType } from '../schemas/auth.schemas.js'

/**
 * First contact after a Supabase sign-in. Resolves (or creates) the application
 * profile for the verified token subject and returns it.
 *
 * The identity used for the lookup is the JWKS-verified `sub` plus the email the
 * Supabase Admin API reports for it — the request body only ever contributes
 * display fields (name, phone) for a brand-new profile.
 */
export const syncCurrentUser = (service: IUserService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const identity = request.supabaseIdentity
    if (!identity) throw new ServiceError('Unauthorized', 401)

    const body = (request.body ?? {}) as SyncBodyType
    const user = await service.syncSupabaseUser(
      { supabaseUserId: identity.supabaseUserId, email: identity.email },
      { firstName: body.firstName, lastName: body.lastName, phone: body.phone ?? null },
    )
    if (!user.isActive) throw new ServiceError('Account is deactivated', 403)
    sendOk(reply, user)
  }
