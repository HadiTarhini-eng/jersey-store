/**
 * Domain wrapper around orderApi.
 * Assembles a backend-shaped `{ order, items }` payload from the client's
 * local cart + selected shipping address.
 */
import { orderApi, extractErrorMessage } from './api';
import type {
  AddressSnapshot, CartItem, CreateOrderPayload, Order,
} from '../types';

export interface BuildOrderArgs {
  userId:          string;
  items:           CartItem[];
  shippingAddress: AddressSnapshot;
  /** Defaults to shipping address if omitted. */
  billingAddress?: AddressSnapshot;
  shippingAmount?: number;
  discountAmount?: number;
  /** Override the generated order number if you have one (e.g. invoice ID). */
  orderNumber?:    string;
}

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function buildPayload(args: BuildOrderArgs): CreateOrderPayload {
  const subtotal = args.items.reduce((sum, i) => sum + i.priceAtTime * i.quantity, 0);
  const totalAmount = subtotal + (args.shippingAmount ?? 0) - (args.discountAmount ?? 0);
  return {
    order: {
      userId:          args.userId,
      orderNumber:     args.orderNumber ?? generateOrderNumber(),
      subtotal,
      discountAmount:  args.discountAmount ?? 0,
      shippingAmount:  args.shippingAmount ?? 0,
      totalAmount,
      shippingAddress: args.shippingAddress,
      billingAddress:  args.billingAddress ?? args.shippingAddress,
    },
    items: args.items.map((i) => ({
      productVariantId:     i.productVariantId,
      productTitleSnapshot: i.productTitle ?? 'Item',
      variantSnapshot:      i.variantLabel ? { label: i.variantLabel } : {},
      quantity:             i.quantity,
      unitPrice:            i.priceAtTime,
    })),
  };
}

export const orderService = {
  createOrder: async (args: BuildOrderArgs): Promise<Order> => {
    return orderApi.create(buildPayload(args));
  },

  placeOrder:   (id: string) => orderApi.place(id),
  getOrder:     (id: string) => orderApi.byId(id),
  getUserOrders:(userId: string) => orderApi.forUser(userId),
  cancelOrder:  (id: string) => orderApi.cancel(id),

  errorMessage: extractErrorMessage,
};
