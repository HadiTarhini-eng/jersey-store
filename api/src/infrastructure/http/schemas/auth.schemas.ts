import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

/**
 * Display fields captured at signup. Email, id and role are never accepted from
 * the client — they come from the verified Supabase identity and the users row.
 */
export const SyncBody = Type.Object({
  firstName: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  lastName: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  phone: Type.Optional(Type.Union([Type.String({ maxLength: 40 }), Type.Null()])),
})
export type SyncBodyType = Static<typeof SyncBody>

export const syncSchema: FastifySchema = { tags: ['Auth'], body: SyncBody }
