import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';
import { clearCart } from '../cart/cartSlice';
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

      const order = await orderService.createOrder({
        userId,
        items: state.cart.items,
        shippingAddress,
      });
      await orderService.placeOrder(order.id);
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
