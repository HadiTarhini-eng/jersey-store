import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { clearCart } from '../cart/cartSlice';
import type {
  AddressSnapshot, CheckoutState, CheckoutStep, Order, CartItem,
} from '../../types';
import type { RootState } from '../../app/store';

// ── Thunk ────────────────────────────────────────────────────────────────────
//
// Order submission is intentionally **local-only** right now:
//   * The reserve/createOrder/placeOrder endpoints all require auth; calling
//     them as a guest returns 401 and our global axios interceptor force-
//     navigates to /login (see services/api/client.ts).
//   * That breaks the requested guest-checkout flow, so we synthesise the
//     order client-side, clear the cart, and let the confirmation screen +
//     WhatsApp share button handle the rest.
//
// When the backend grows a real guest-order endpoint, swap the body of this
// thunk back to the network flow.

function guestUserId(): string {
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + it.priceAtTime * it.quantity, 0);
}

function buildLocalOrder(userId: string, items: CartItem[], shipping: AddressSnapshot): Order {
  const now      = new Date().toISOString();
  const subtotal = cartSubtotal(items);
  return {
    id:              `local-${Date.now().toString(36)}`,
    isActive:        true,
    createdAt:       now,
    updatedAt:       now,
    userId,
    orderNumber:     generateOrderNumber(),
    status:          'pending',
    paymentStatus:   'pending',
    subtotal,
    discountAmount:  0,
    shippingAmount:  0,
    totalAmount:     subtotal,
    shippingAddress: shipping,
    billingAddress:  shipping,
    placedAt:        now,
  };
}

export const submitOrder = createAsyncThunk<Order, AddressSnapshot, { state: RootState }>(
  'checkout/submitOrder',
  async (shippingAddress, { getState, dispatch }) => {
    const state  = getState();
    const userId = state.auth.user?.id ?? guestUserId();

    const order = buildLocalOrder(userId, state.cart.items, shippingAddress);

    // Cart is empty after the order is "sent" so a second confirm can't fire.
    dispatch(clearCart());

    return order;
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
      .addCase(submitOrder.rejected,  (state, { error }) => {
        state.loading = false;
        state.error   = error.message ?? 'Order submission failed.';
      });
  },
});

export const { setStep, setShippingAddress, resetCheckout, clearCheckoutError } = checkoutSlice.actions;
export default checkoutSlice.reducer;
