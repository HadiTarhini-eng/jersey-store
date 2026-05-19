import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';
import { productApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { clearCart, convertServerCart } from '../cart/cartSlice';
import type { AddressSnapshot, CheckoutState, CheckoutStep } from '../../types';
import type { RootState } from '../../app/store';

// ── Thunk ────────────────────────────────────────────────────────────────────

export const submitOrder = createAsyncThunk(
  'checkout/submitOrder',
  async (shippingAddress: AddressSnapshot, { getState, dispatch, rejectWithValue }) => {
    try {
      const state  = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) throw new Error('You must be signed in to place an order.');

      // Reserve stock for each line item before creating the order. If any
      // variant is short on stock the backend returns 409/400 — surface that
      // message instead of pushing an order through with missing inventory.
      for (const item of state.cart.items) {
        try {
          await productApi.variants.reserve(item.productVariantId, item.quantity);
        } catch (err) {
          throw new Error(extractErrorMessage(err, `Not enough stock for ${item.productTitle ?? 'one of your items'}.`));
        }
      }

      const order = await orderService.createOrder({
        userId,
        items: state.cart.items,
        shippingAddress,
      });
      await orderService.placeOrder(order.id);
      if (state.cart.cartId) {
        await dispatch(convertServerCart(state.cart.cartId));
      }
      dispatch(clearCart());
      return order;
    } catch (err) {
      return rejectWithValue(orderService.errorMessage(err, 'Order submission failed.'));
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState: CheckoutState = {
  step:            'shipping',
  shippingAddress: null,
  loading:         false,
  error:           null,
  order:           null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep:            (state, action: PayloadAction<CheckoutStep>) => { state.step = action.payload; },
    setShippingAddress: (state, action: PayloadAction<AddressSnapshot>) => {
      state.shippingAddress = action.payload;
      state.step            = 'review';
    },
    resetCheckout:      () => initialState,
    clearCheckoutError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(submitOrder.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.order   = payload;
        state.step    = 'confirmation';
      })
      .addCase(submitOrder.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });
  },
});

export const { setStep, setShippingAddress, resetCheckout, clearCheckoutError } = checkoutSlice.actions;
export default checkoutSlice.reducer;
