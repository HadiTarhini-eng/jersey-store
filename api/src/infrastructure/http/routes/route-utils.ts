import { type FastifyReply, type FastifyRequest } from 'fastify'
import { ServiceError } from '../../services/errors.js'

export const sendCreated = (reply: FastifyReply, payload: unknown) => reply.status(201).send(payload)
export const sendOk = (reply: FastifyReply, payload: unknown) => reply.status(200).send(payload)
export const sendDeleted = (reply: FastifyReply) => reply.status(204).send()

type JwtUser = { id: string; email: string; role: 'Admin' | 'User' }

export const jwtUser = (request: FastifyRequest): JwtUser => request.user as JwtUser

export const assertOwner = (request: FastifyRequest, resourceUserId: string | null | undefined): void => {
  const { id, role } = jwtUser(request)
  // Guest-owned resources (userId === null) are never accessible through
  // auth-required endpoints — only Admins can inspect them, and only when
  // an explicit admin-scoped route routes here.
  if (role === 'Admin') return
  if (!resourceUserId || id !== resourceUserId) throw new ServiceError('Forbidden', 403)
}
