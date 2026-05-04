import { configureStore } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import authReducer     from '../features/auth/authSlice';
import productsReducer from '../features/products/productsSlice';
import cartReducer     from '../features/cart/cartSlice';
import checkoutReducer from '../features/checkout/checkoutSlice';
import { cartLocalStorageMiddleware } from '../features/cart/cartMiddleware';

// Cast the custom middleware so RTK can infer the store type without circular errors
const cartMiddleware = cartLocalStorageMiddleware as unknown as Middleware;

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    products: productsReducer,
    cart:     cartReducer,
    checkout: checkoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cartMiddleware),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
