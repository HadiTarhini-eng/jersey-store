import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getStoredCart } from '../../utils/storage';
import type { CartItem, CartState } from '../../types';

// Rehydrate cart for the current user (or guest) from localStorage on startup
const initialItems = getStoredCart(null);

const initialState: CartState = {
  items:   initialItems,
  isOpen:  false,
  loading: false,
  error:   null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /** Add an item or increment quantity if same product+size already exists. */
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId && i.size === action.payload.size,
      );
      if (existing) {
        existing.quantity = Math.min(existing.quantity + action.payload.quantity, existing.maxStock);
      } else {
        state.items.push(action.payload);
      }
    },

    /** Remove a specific product+size combination. */
    removeFromCart: (state, action: PayloadAction<{ productId: string; size: string }>) => {
      state.items = state.items.filter(
        (i) => !(i.productId === action.payload.productId && i.size === action.payload.size),
      );
    },

    /** Set an exact quantity (clamped between 1 and maxStock). */
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; size: string; quantity: number }>,
    ) => {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId && i.size === action.payload.size,
      );
      if (item) {
        item.quantity = Math.max(1, Math.min(action.payload.quantity, item.maxStock));
      }
    },

    clearCart: (state) => { state.items = []; },

    openCart:  (state) => { state.isOpen = true; },
    closeCart: (state) => { state.isOpen = false; },
    toggleCart:(state) => { state.isOpen = !state.isOpen; },

    /** Call this after login/logout to reload the right user's cart. */
    rehydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
  rehydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;
