import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
} from '../cartSlice';
import type { CartItem } from '../../../types';

export function useCart() {
  const dispatch = useAppDispatch();
  const { items, isOpen } = useAppSelector((s) => s.cart);

  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum: number, i: CartItem) => sum + i.price * i.quantity, 0);

  const add    = useCallback((item: CartItem) => dispatch(addToCart(item)), [dispatch]);
  const remove = useCallback(
    (productId: string, size: string) => dispatch(removeFromCart({ productId, size })),
    [dispatch],
  );
  const setQty = useCallback(
    (productId: string, size: string, quantity: number) =>
      dispatch(updateQuantity({ productId, size, quantity })),
    [dispatch],
  );
  const clear  = useCallback(() => dispatch(clearCart()), [dispatch]);
  const open   = useCallback(() => dispatch(openCart()), [dispatch]);
  const close  = useCallback(() => dispatch(closeCart()), [dispatch]);
  const toggle = useCallback(() => dispatch(toggleCart()), [dispatch]);

  return { items, isOpen, totalItems, subtotal, add, remove, setQty, clear, open, close, toggle };
}
