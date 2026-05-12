import type { Middleware, MiddlewareAPI, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { storeCart } from '../../utils/storage';

/**
 * After every cart action, persist the current items to localStorage
 * keyed by the authenticated user's ID (or "guest" if not logged in).
 *
 * Using a loose type for the store API avoids the circular reference that
 * occurs when importing RootState from store.ts (which imports this file).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cartLocalStorageMiddleware: Middleware<object, any> =
  (api: MiddlewareAPI<Dispatch<UnknownAction>>) => (next) => (action) => {
    const result = next(action);

    if (
      typeof action === 'object' &&
      action !== null &&
      'type' in action &&
      typeof (action as { type: string }).type === 'string' &&
      (action as { type: string }).type.startsWith('cart/')
    ) {
      const state  = api.getState();
      const userId: string | null = state?.auth?.user?.id ?? null;
      const items  = state?.cart?.items ?? [];
      storeCart(userId, items);
    }

    return result;
  };
