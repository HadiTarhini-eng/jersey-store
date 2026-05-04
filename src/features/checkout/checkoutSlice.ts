import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';
import { clearCart } from '../cart/cartSlice';
import type { CheckoutState, CheckoutStep, ShippingAddress } from '../../types';
import type { RootState } from '../../app/store';

// ── Thunk ────────────────────────────────────────────────────────────────────

export const submitOrder = createAsyncThunk(
  'checkout/submitOrder',
  async (shippingAddress: ShippingAddress, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const order = await orderService.createOrder({
        items: state.cart.items,
        shippingAddress,
      });
      dispatch(clearCart());
      return order;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Order submission failed.');
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
    setStep: (state, action: PayloadAction<CheckoutStep>) => {
      state.step = action.payload;
    },
    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
      state.step            = 'review';
    },
    resetCheckout: () => initialState,
    clearCheckoutError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitOrder.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.order   = payload;
        state.step    = 'confirmation';
      })
      .addCase(submitOrder.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });
  },
});

export const { setStep, setShippingAddress, resetCheckout, clearCheckoutError } = checkoutSlice.actions;
export default checkoutSlice.reducer;
