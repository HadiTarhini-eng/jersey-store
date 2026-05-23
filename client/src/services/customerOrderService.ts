/**
 * Customer-facing order history service.
 *
 * ⚠️ FRONT-END ONLY for now. Reads from src/data/customer-orders.json so
 * the UI can be built and demo'd before the backend exposes a customer-
 * facing orders endpoint. When the backend lands (e.g. GET /orders/me,
 * GET /orders/:id), swap the body of these functions to call the API
 * — the return types are already in their final shape.
 */

import customerOrdersSeed from '../data/customer-orders.json';
import type { AddressSnapshot, OrderStatus, PaymentStatus } from '../types';

export interface CustomerOrderItem {
  productId: string;
  name:      string;
  image:     string;
  size:      string;
  quantity:  number;
  price:     number;
}

export interface CustomerOrder {
  id:                 string;
  orderNumber:        string;
  items:              CustomerOrderItem[];
  subtotal:           number;
  shipping:           number;
  total:              number;
  status:             OrderStatus;
  paymentStatus:      PaymentStatus;
  shippingAddress:    AddressSnapshot;
  createdAt:          string;
  estimatedDelivery?: string;
}

const STORAGE_KEY = 'js_customer_orders';

/**
 * Read the in-memory copy of orders. On first call clones the JSON seed
 * into localStorage so updates (status changes from the admin side, for
 * example) can survive a reload. Returns a fresh array each call.
 */
function readOrders(): CustomerOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CustomerOrder[];
    const seed = customerOrdersSeed as CustomerOrder[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return [...seed];
  } catch {
    return customerOrdersSeed as CustomerOrder[];
  }
}

export const customerOrderService = {
  /** All orders for the current user, newest first. TODO: swap to GET /orders/me. */
  list: async (): Promise<CustomerOrder[]> => {
    const orders = readOrders();
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  /** Single order by id. TODO: swap to GET /orders/:id (scoped to current user). */
  findById: async (id: string): Promise<CustomerOrder | null> => {
    const orders = readOrders();
    return orders.find((o) => o.id === id) ?? null;
  },
};
