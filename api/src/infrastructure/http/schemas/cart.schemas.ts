import { Type, type Static } from '@sinclair/typebox'
import type { FastifySchema } from 'fastify'

const CartBody = Type.Object({
  id: Type.Optional(Type.String()),
  userId: Type.String(),
  status: Type.Optional(Type.Union([
    Type.Literal('active'), Type.Literal('converted'), Type.Literal('abandoned'),
  ])),
  isActive: Type.Optional(Type.Boolean()),
})
export type CartBodyType = Static<typeof CartBody>

const CartItemBody = Type.Object({
  id: Type.Optional(Type.String()),
  productVariantId: Type.String(),
  quantity: Type.Integer({ minimum: 1 }),
  priceAtTime: Type.Number({ minimum: 0 }),
  isActive: Type.Optional(Type.Boolean()),
})
export type CartItemBodyType = Static<typeof CartItemBody>

const UpdateQuantityBody = Type.Object({ quantity: Type.Integer({ minimum: 1 }) })
export type UpdateQuantityBodyType = Static<typeof UpdateQuantityBody>

const CartIdParams = Type.Object({ cartId: Type.String() })
const UserIdParams = Type.Object({ userId: Type.String() })
const IdParams = Type.Object({ id: Type.String() })

export const createCartSchema: FastifySchema = { tags: ['Carts'], body: CartBody }
export const getUserCartSchema: FastifySchema = { tags: ['Carts'], params: UserIdParams }
export const addCartItemSchema: FastifySchema = { tags: ['CartItems'], params: CartIdParams, body: CartItemBody }
export const listCartItemsSchema: FastifySchema = { tags: ['CartItems'], params: CartIdParams }
export const updateCartItemSchema: FastifySchema = { tags: ['CartItems'], params: IdParams, body: UpdateQuantityBody }
export const removeCartItemSchema: FastifySchema = { tags: ['CartItems'], params: IdParams }
export const abandonCartSchema: FastifySchema = { tags: ['Carts'], params: IdParams }
export const convertCartSchema: FastifySchema = { tags: ['Carts'], params: IdParams }
