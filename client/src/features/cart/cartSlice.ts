import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { cartApi, extractErrorMessage } from '../../services/api';
import { getStoredCart } from '../../utils/storage';
import type { CartItem, CartState } from '../../types';

// ── Thunks ───────────────────────────────────────────────────────────────────

/**
 * Pull the authenticated user's server cart and replace the local working copy.
 * Called after login. The local guest cart is intentionally not merged — that
 * would require server-side reconciliation we don't have yet.
 */
export const loadServerCart = createAsyncThunk(
  'cart/loadServer',
  async (userId: string, { rejectWithValue }) => {
    try {
      const cart  = await cartApi.forUser(userId);
      const items = await cartApi.listItems(cart.id);
      return { cartId: cart.id, items };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to load cart.'));
    }
  },
);

/** Push a single new item to the server cart (no-op for guests). */
export const syncAddItem = createAsyncThunk(
  'cart/syncAdd',
  async (
    { cartId, productVariantId, quantity, priceAtTime }:
      { cartId: string; productVariantId: string; quantity: number; priceAtTime: number },
    { rejectWithValue },
  ) => {
    try {
      return await cartApi.addItem(cartId, { productVariantId, quantity, priceAtTime });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to add to cart.'));
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState: CartState = {
  cartId:  null,
  items:   getStoredCart(null),
  isOpen:  false,
  loading: false,
  error:   null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /** Add an item or increment its quantity if the same variant already exists. */
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((i) => i.productVariantId === action.payload.productVariantId);
      if (existing) {
        const max = existing.maxStock ?? existing.quantity + action.payload.quantity;
        existing.quantity = Math.min(existing.quantity + action.payload.quantity, max);
      } else {
        state.items.push(action.payload);
      }
    },

    removeFromCart: (state, action: PayloadAction<{ productVariantId: string }>) => {
      state.items = state.items.filter((i) => i.productVariantId !== action.payload.productVariantId);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productVariantId: string; quantity: number }>,
    ) => {
      const item = state.items.find((i) => i.productVariantId === action.payload.productVariantId);
      if (item) {
        const max = item.maxStock ?? action.payload.quantity;
        item.quantity = Math.max(1, Math.min(action.payload.quantity, max));
      }
    },

    clearCart:  (state) => { state.items = []; state.cartId = null; },
    openCart:   (state) => { state.isOpen = true; },
    closeCart:  (state) => { state.isOpen = false; },
    toggleCart: (state) => { state.isOpen = !state.isOpen; },

    /** Call after login/logout to load the right user's cart from localStorage. */
    rehydrateCart: (state, action: PayloadAction<CartItem[]>) => { state.items = action.payload; },

    setCartId: (state, action: PayloadAction<string | null>) => { state.cartId = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadServerCart.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(loadServerCart.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.cartId  = payload.cartId;
        state.items   = payload.items;
      })
      .addCase(loadServerCart.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });
  },
});

export const {
  addToCart, removeFromCart, updateQuantity,
  clearCart, openCart, closeCart, toggleCart,
  rehydrateCart, setCartId,
} = cartSlice.actions;

export default cartSlice.reducer;
