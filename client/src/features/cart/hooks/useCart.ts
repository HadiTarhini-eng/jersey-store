import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  addToCart, removeFromCart, updateQuantity,
  clearCart, openCart, closeCart, toggleCart,
  syncAddItem, syncRemoveItem, syncUpdateQuantity,
} from '../cartSlice';
import type { CartItem } from '../../../types';

export function useCart() {
  const dispatch = useAppDispatch();
  const { items, isOpen, cartId } = useAppSelector((s) => s.cart);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum: number, i: CartItem) => sum + i.priceAtTime * i.quantity, 0);

  const add = useCallback((item: CartItem) => {
    if (isAuthenticated && cartId) {
      void dispatch(syncAddItem({ cartId, item }));
      return;
    }
    dispatch(addToCart(item));
  }, [cartId, dispatch, isAuthenticated]);
  const remove = useCallback(
    (productVariantId: string) => {
      if (isAuthenticated) {
        const itemId = items.find((item) => item.productVariantId === productVariantId)?.id;
        if (itemId) {
          void dispatch(syncRemoveItem({ itemId, productVariantId }));
          return;
        }
      }
      dispatch(removeFromCart({ productVariantId }));
    },
    [dispatch, isAuthenticated, items],
  );
  const setQty = useCallback(
    (productVariantId: string, quantity: number) => {
      if (isAuthenticated) {
        const itemId = items.find((item) => item.productVariantId === productVariantId)?.id;
        if (itemId) {
          void dispatch(syncUpdateQuantity({ itemId, productVariantId, quantity }));
          return;
        }
      }
      dispatch(updateQuantity({ productVariantId, quantity }));
    },
    [dispatch, isAuthenticated, items],
  );
  const clear  = useCallback(() => dispatch(clearCart()), [dispatch]);
  const open   = useCallback(() => dispatch(openCart()), [dispatch]);
  const close  = useCallback(() => dispatch(closeCart()), [dispatch]);
  const toggle = useCallback(() => dispatch(toggleCart()), [dispatch]);

  return { items, isOpen, totalItems, subtotal, add, remove, setQty, clear, open, close, toggle };
}
