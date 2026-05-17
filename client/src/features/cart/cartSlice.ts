import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { cartApi, extractErrorMessage } from '../../services/api';
import { clearStoredCart, getStoredCart } from '../../utils/storage';
import type { CartItem, CartState } from '../../types';
import type { RootState } from '../../app/store';

interface ServerCartPayload {
  cartId: string;
  items: CartItem[];
}

interface SyncAddItemArgs {
  cartId: string;
  item: CartItem;
}

interface SyncQuantityArgs {
  itemId: string;
  productVariantId: string;
  quantity: number;
}

interface SyncRemoveItemArgs {
  itemId: string;
  productVariantId: string;
}

async function ensureServerCart(userId: string) {
  try {
    return await cartApi.forUser(userId);
  } catch {
    return cartApi.create({ userId, status: 'active' });
  }
}

export const hydrateAuthenticatedCart = createAsyncThunk(
  'cart/hydrateAuthenticated',
  async (userId: string, { rejectWithValue }) => {
    try {
      const cart = await ensureServerCart(userId);
      const existingItems = await cartApi.listItems(cart.id);
      const guestItems = getStoredCart(null);

      if (guestItems.length > 0) {
        const existingByVariant = new Map(existingItems.map((item) => [item.productVariantId, item]));

        for (const guestItem of guestItems) {
          const match = existingByVariant.get(guestItem.productVariantId);
          if (match) {
            await cartApi.updateItem(match.id, match.quantity + guestItem.quantity);
          } else {
            await cartApi.addItem(cart.id, {
              productVariantId: guestItem.productVariantId,
              quantity: guestItem.quantity,
              priceAtTime: guestItem.priceAtTime,
            });
          }
        }

        clearStoredCart(null);
      }

      const items = await cartApi.listItems(cart.id);
      return { cartId: cart.id, items } satisfies ServerCartPayload;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to load cart.'));
    }
  },
);

export const syncAddItem = createAsyncThunk(
  'cart/syncAdd',
  async ({ cartId, item }: SyncAddItemArgs, { rejectWithValue }) => {
    try {
      const created = await cartApi.addItem(cartId, {
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
      });
      return {
        item: {
          ...created,
          productTitle: item.productTitle,
          image: item.image,
          variantLabel: item.variantLabel,
          maxStock: item.maxStock,
        },
      };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to add to cart.'));
    }
  },
);

export const syncUpdateQuantity = createAsyncThunk(
  'cart/syncUpdateQuantity',
  async ({ itemId, productVariantId, quantity }: SyncQuantityArgs, { rejectWithValue }) => {
    try {
      const item = await cartApi.updateItem(itemId, quantity);
      return { item, productVariantId };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to update cart item.'));
    }
  },
);

export const syncRemoveItem = createAsyncThunk(
  'cart/syncRemoveItem',
  async ({ itemId, productVariantId }: SyncRemoveItemArgs, { rejectWithValue }) => {
    try {
      await cartApi.removeItem(itemId);
      return { productVariantId };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to remove cart item.'));
    }
  },
);

export const convertServerCart = createAsyncThunk(
  'cart/convertServer',
  async (cartId: string, { rejectWithValue }) => {
    try {
      await cartApi.convert(cartId);
      return cartId;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to finalize cart.'));
    }
  },
);

const initialState: CartState = {
  cartId: null,
  items: getStoredCart(null),
  isOpen: false,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((item) => item.productVariantId === action.payload.productVariantId);
      if (existing) {
        const max = existing.maxStock ?? existing.quantity + action.payload.quantity;
        existing.quantity = Math.min(existing.quantity + action.payload.quantity, max);
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<{ productVariantId: string }>) => {
      state.items = state.items.filter((item) => item.productVariantId !== action.payload.productVariantId);
    },
    updateQuantity: (state, action: PayloadAction<{ productVariantId: string; quantity: number }>) => {
      const item = state.items.find((entry) => entry.productVariantId === action.payload.productVariantId);
      if (item) {
        const max = item.maxStock ?? action.payload.quantity;
        item.quantity = Math.max(1, Math.min(action.payload.quantity, max));
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.cartId = null;
    },
    openCart: (state) => { state.isOpen = true; },
    closeCart: (state) => { state.isOpen = false; },
    toggleCart: (state) => { state.isOpen = !state.isOpen; },
    rehydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.cartId = null;
    },
    setCartId: (state, action: PayloadAction<string | null>) => {
      state.cartId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuthenticatedCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(hydrateAuthenticatedCart.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.cartId = payload.cartId;
        state.items = payload.items;
      })
      .addCase(hydrateAuthenticatedCart.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })
      .addCase(syncAddItem.fulfilled, (state, { payload }) => {
        const existing = state.items.find((item) => item.productVariantId === payload.item.productVariantId);
        if (existing) {
          Object.assign(existing, payload.item);
        } else {
          state.items.push(payload.item);
        }
      })
      .addCase(syncAddItem.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(syncUpdateQuantity.fulfilled, (state, { payload }) => {
        const item = state.items.find((entry) => entry.productVariantId === payload.productVariantId);
        if (item) {
          Object.assign(item, payload.item, {
            productTitle: item.productTitle,
            image: item.image,
            variantLabel: item.variantLabel,
            maxStock: item.maxStock,
          });
        }
      })
      .addCase(syncUpdateQuantity.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(syncRemoveItem.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((item) => item.productVariantId !== payload.productVariantId);
      })
      .addCase(syncRemoveItem.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(convertServerCart.fulfilled, (state) => {
        state.cartId = null;
      })
      .addCase(convertServerCart.rejected, (state, { payload }) => {
        state.error = payload as string;
      });
  },
});

export const selectServerCartItemId = (state: RootState, productVariantId: string) =>
  state.cart.items.find((item) => item.productVariantId === productVariantId)?.id ?? null;

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
  rehydrateCart,
  setCartId,
} = cartSlice.actions;

export default cartSlice.reducer;
