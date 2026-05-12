import type { FastifyReply, FastifyRequest } from 'fastify'
import { Cart, CartItem } from '../../../core/entities/commerce.js'
import type { ICartService } from '../../../core/services/commerce.svc.js'
import { NotFoundError } from '../../services/errors.js'
import { assertOwner, sendCreated, sendDeleted, sendOk } from '../routes/route-utils.js'
import type { CartBodyType, CartItemBodyType, UpdateQuantityBodyType } from '../schemas/cart.schemas.js'

type CartIdParams = { cartId: string }
type UserIdParams = { userId: string }
type IdParams = { id: string }

export const createCart = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as CartBodyType
    assertOwner(request, body.userId)
    sendCreated(reply, await service.createCart(new Cart(body)))
  }

export const getUserCart = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params as UserIdParams
    assertOwner(request, userId)
    sendOk(reply, await service.getActiveCartByUser(userId))
  }

export const addCartItem = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { cartId } = request.params as CartIdParams
    const cart = await service.getCartById(cartId)
    if (!cart) throw new NotFoundError('Cart')
    assertOwner(request, cart.userId)
    const body = request.body as CartItemBodyType
    sendCreated(reply, await service.addItem(new CartItem({ ...body, cartId } as any)))
  }

export const listCartItems = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { cartId } = request.params as CartIdParams
    const cart = await service.getCartById(cartId)
    if (!cart) throw new NotFoundError('Cart')
    assertOwner(request, cart.userId)
    sendOk(reply, await service.listCartItems(cartId))
  }

export const updateCartItem = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const cartItem = await service.getCartItemById(id)
    if (!cartItem) throw new NotFoundError('Cart item')
    const cart = await service.getCartById(cartItem.cartId)
    if (!cart) throw new NotFoundError('Cart')
    assertOwner(request, cart.userId)
    const { quantity } = request.body as UpdateQuantityBodyType
    sendOk(reply, await service.updateItemQuantity(id, quantity))
  }

export const removeCartItem = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const cartItem = await service.getCartItemById(id)
    if (!cartItem) throw new NotFoundError('Cart item')
    const cart = await service.getCartById(cartItem.cartId)
    if (!cart) throw new NotFoundError('Cart')
    assertOwner(request, cart.userId)
    await service.removeItem(id)
    sendDeleted(reply)
  }

export const abandonCart = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const cart = await service.getCartById(id)
    if (!cart) throw new NotFoundError('Cart')
    assertOwner(request, cart.userId)
    sendOk(reply, await service.abandonCart(id))
  }

export const convertCart = (service: ICartService) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as IdParams
    const cart = await service.getCartById(id)
    if (!cart) throw new NotFoundError('Cart')
    assertOwner(request, cart.userId)
    sendOk(reply, await service.convertCart(id))
  }
