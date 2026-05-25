import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  addToCart, removeFromCart, updateQuantity,
  clearCart, openCart, closeCart, toggleCart,
  syncAddItem, syncRemoveItem, syncUpdateQuantity,
  hydrateAuthenticatedCart,
} from '../cartSlice';
import type { CartItem } from '../../../types';

/**
 * A cart item is "backend-tracked" when its id comes from the server
 * (real UUID). ProductDetailView synthesises ids like `local-<variantId>` for
 * items added in-memory before the server cart hydrates — those can't be
 * reached via the cart-items API and must be operated on locally.
 */
function isBackendId(id: string | undefined | null): boolean {
  return !!id && !id.startsWith('local-');
}

export function useCart() {
  const dispatch = useAppDispatch();
  const { items, isOpen, cartId } = useAppSelector((s) => s.cart);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum: number, i: CartItem) => sum + i.priceAtTime * i.quantity, 0);

  const add = useCallback(async (item: CartItem) => {
    // Guest path — straight into local reducer; cartMiddleware persists.
    if (!isAuthenticated || !user) {
      dispatch(addToCart(item));
      return;
    }

    // Authenticated but the server cart hasn't been hydrated yet (e.g. the
    // user just refreshed). Lazy-hydrate first so the add actually persists,
    // otherwise the item would only live in memory and disappear on reload.
    let resolvedCartId = cartId;
    if (!resolvedCartId) {
      const result = await dispatch(hydrateAuthenticatedCart(user.id));
      if (hydrateAuthenticatedCart.fulfilled.match(result)) {
        resolvedCartId = result.payload.cartId;
      }
    }

    if (resolvedCartId) {
      void dispatch(syncAddItem({ cartId: resolvedCartId, item }));
    } else {
      // Hydration failed (offline / 500). Fall back to local so the UX
      // doesn't dead-end — middleware won't persist for authed users, but
      // the next successful hydrate will merge any local items it finds.
      dispatch(addToCart(item));
    }
  }, [cartId, dispatch, isAuthenticated, user]);

  const remove = useCallback(
    (productVariantId: string) => {
      const item = items.find((i) => i.productVariantId === productVariantId);
      // Only hit the backend when this item actually exists on the server
      // (real id, not a `local-*` placeholder). Otherwise we'd get a 404 and
      // the rejected case would leave the item stuck in state.
      if (isAuthenticated && item && isBackendId(item.id)) {
        void dispatch(syncRemoveItem({ itemId: item.id, productVariantId }));
        return;
      }
      dispatch(removeFromCart({ productVariantId }));
    },
    [dispatch, isAuthenticated, items],
  );

  const setQty = useCallback(
    (productVariantId: string, quantity: number) => {
      const item = items.find((i) => i.productVariantId === productVariantId);
      if (isAuthenticated && item && isBackendId(item.id)) {
        void dispatch(syncUpdateQuantity({ itemId: item.id, productVariantId, quantity }));
        return;
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
