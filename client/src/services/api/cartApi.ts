import { http } from './client';
import { endpoints } from './endpoints';
import type { AddCartItemPayload, Cart, CartItem, CreateCartPayload } from '../../types';

export const cartApi = {
  create:     (body: CreateCartPayload)               => http.post<Cart>(endpoints.carts.create(), body),
  forUser:    (userId: string)                        => http.get<Cart>(endpoints.carts.forUser(userId)),

  listItems:  (cartId: string)                        => http.get<CartItem[]>(endpoints.carts.listItems(cartId)),
  addItem:    (cartId: string, body: AddCartItemPayload) =>
                http.post<CartItem>(endpoints.carts.addItem(cartId), body),
  updateItem: (itemId: string, quantity: number)      =>
                http.patch<CartItem>(endpoints.carts.updateItem(itemId), { quantity }),
  removeItem: (itemId: string)                        => http.delete<void>(endpoints.carts.removeItem(itemId)),

  abandon:    (cartId: string)                        => http.post<Cart>(endpoints.carts.abandon(cartId)),
  convert:    (cartId: string)                        => http.post<Cart>(endpoints.carts.convert(cartId)),
};
