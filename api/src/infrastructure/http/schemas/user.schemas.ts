import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const IdParams = Type.Object({ id: Type.String() })

const RoleEnum = Type.Union([Type.Literal('Admin'), Type.Literal('User')])

const AddressBody = Type.Object({
  fullName: Type.String({ minLength: 1, maxLength: 200 }),
  phone: Type.String({ minLength: 1, maxLength: 40 }),
  addressLine1: Type.String({ minLength: 1, maxLength: 300 }),
  addressLine2: Type.Optional(Type.Union([Type.String({ maxLength: 300 }), Type.Null()])),
  city: Type.String({ minLength: 1, maxLength: 150 }),
  state: Type.Optional(Type.Union([Type.String({ maxLength: 150 }), Type.Null()])),
  country: Type.String({ minLength: 1, maxLength: 150 }),
  postalCode: Type.Optional(Type.Union([Type.String({ maxLength: 40 }), Type.Null()])),
})

// Email is owned by Supabase Auth (verified there) and mirrored by /auth/sync,
// so it is deliberately not updatable here.
const UpdateUserBody = Type.Object({
  firstName: Type.Optional(Type.String({ minLength: 1 })),
  lastName: Type.Optional(Type.String({ minLength: 1 })),
  phone: Type.Optional(Type.String({ maxLength: 40 })),
  // Saved default shipping address; null clears it.
  shippingAddress: Type.Optional(Type.Union([AddressBody, Type.Null()])),
})
export type UpdateUserBodyType = Static<typeof UpdateUserBody>

const ChangeRoleBody = Type.Object({ role: RoleEnum })
export type ChangeRoleBodyType = Static<typeof ChangeRoleBody>

const AvatarUploadBody = Type.Object({
  file: Type.Unsafe<unknown>({ type: 'string', format: 'binary', description: 'Avatar image. Max 2 MB. image/*.' }),
})

export const getMeSchema: FastifySchema = { tags: ['Users'] }
export const listUsersSchema: FastifySchema = { tags: ['Users'] }
export const getUserSchema: FastifySchema = { tags: ['Users'], params: IdParams }
export const updateUserSchema: FastifySchema = { tags: ['Users'], params: IdParams, body: UpdateUserBody }
export const changeRoleSchema: FastifySchema = { tags: ['Users'], params: IdParams, body: ChangeRoleBody }
// Multipart: handler parses `file` part via request.file().
export const setProfileImageSchema: FastifySchema = { tags: ['Users'], consumes: ['multipart/form-data'], params: IdParams, description: 'Multipart: `file` (avatar image).' }
export const removeProfileImageSchema: FastifySchema = { tags: ['Users'], params: IdParams }
export const activateUserSchema: FastifySchema = { tags: ['Users'], params: IdParams }
export const deactivateUserSchema: FastifySchema = { tags: ['Users'], params: IdParams }
