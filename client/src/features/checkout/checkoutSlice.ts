import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { clearCart } from '../cart/cartSlice';
import { orderApi, extractErrorMessage } from '../../services/api';
import type {
  AddressSnapshot, AppliedCoupon, CheckoutState, CheckoutStep, Order,
} from '../../types';
import type { RootState } from '../../app/store';

// ── Thunk ────────────────────────────────────────────────────────────────────
//
// Posts the cart to `POST /orders/guest` (anonymous). The server resolves
// per-variant prices, validates the optional coupon, recomputes
// subtotal/discount/total, and snapshots the order. We attach the local
// itemsSnapshot purely so the WhatsApp confirmation message can render
// product titles + variant labels (those aren't in the order_items table
// in a form ready to display).

export const submitOrder = createAsyncThunk<Order, AddressSnapshot, { state: RootState; rejectValue: string }>(
  'checkout/submitOrder',
  async (shippingAddress, { getState, dispatch, rejectWithValue }) => {
    const state  = getState();
    const items  = state.cart.items;
    const coupon: AppliedCoupon | null = state.checkout.coupon;

    try {
      const result = await orderApi.createGuest({
        guestEmail:        null,
        couponCode:        coupon?.code ?? null,
        couponItemsApplied: coupon?.itemsApplied ?? null,
        shippingAddress,
        billingAddress:    shippingAddress,
        items: items.map((it) => ({
          productVariantId: it.productVariantId,
          quantity:         it.quantity,
          customName:       it.customName ?? null,
          customNumber:     it.customNumber ?? null,
        })),
      });
      // Cart only clears on success — a failed submit leaves the cart intact
      // so the customer can fix the error (e.g. expired coupon) and retry.
      dispatch(clearCart());
      return { ...result.order, itemsSnapshot: items };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Order submission failed.'));
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
  coupon:          null,
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
    applyCoupon:        (state, action: PayloadAction<AppliedCoupon>) => { state.coupon = action.payload; },
    removeCoupon:       (state) => { state.coupon = null; },
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
      .addCase(submitOrder.rejected,  (state, { payload, error }) => {
        state.loading = false;
        state.error   = (payload as string | undefined) ?? error.message ?? 'Order submission failed.';
      });
  },
});

export const {
  setStep, setShippingAddress, applyCoupon, removeCoupon, resetCheckout, clearCheckoutError,
} = checkoutSlice.actions;
export default checkoutSlice.reducer;
