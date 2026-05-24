/**
 * Customer-facing order history service. Backed by the real /orders API:
 *   - list(userId)            → GET /users/:userId/orders + items per order
 *   - findById(id)            → GET /orders/:id            + items for that order
 *
 * Maps the backend `Order` + `OrderItem` shapes into the flatter
 * `CustomerOrder` shape the storefront's Orders / Order Detail pages
 * already consume.
 */

import { orderApi } from './api';
import type {
  AddressSnapshot,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from '../types';

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

/**
 * Address snapshots are stored in the orders table as opaque JSON. Older
 * rows use Stripe-ish `line1` keys; newer ones use the storefront's
 * `addressLine1`. Normalize so the UI only has to think about one shape.
 */
function normalizeAddress(raw: any): AddressSnapshot {
  return {
    fullName:     raw?.fullName     ?? '',
    phone:        raw?.phone        ?? '',
    addressLine1: raw?.addressLine1 ?? raw?.line1 ?? '',
    addressLine2: raw?.addressLine2 ?? raw?.line2 ?? null,
    city:         raw?.city         ?? '',
    state:        raw?.state        ?? null,
    country:      raw?.country      ?? '',
    postalCode:   raw?.postalCode   ?? null,
  };
}

function toCustomerItem(item: OrderItem): CustomerOrderItem {
  const snapshot = (item.variantSnapshot ?? {}) as Record<string, unknown>;
  return {
    productId: item.productVariantId,
    name:      item.productTitleSnapshot,
    image:     (snapshot.image as string | undefined) ?? '',
    size:      (snapshot.size  as string | undefined) ?? '',
    quantity:  item.quantity,
    price:     item.unitPrice,
  };
}

async function toCustomerOrder(order: Order): Promise<CustomerOrder> {
  let items: OrderItem[] = [];
  try {
    items = await orderApi.items(order.id);
  } catch {
    items = [];
  }
  return {
    id:              order.id,
    orderNumber:     order.orderNumber,
    items:           items.map(toCustomerItem),
    subtotal:        order.subtotal,
    shipping:        order.shippingAmount,
    total:           order.totalAmount,
    status:          order.status,
    paymentStatus:   order.paymentStatus,
    shippingAddress: normalizeAddress(order.shippingAddress),
    createdAt:       (order.placedAt ?? order.createdAt) as string,
  };
}

export const customerOrderService = {
  /** All orders for the given user, newest first. */
  list: async (userId: string): Promise<CustomerOrder[]> => {
    if (!userId) return [];
    const orders = await orderApi.forUser(userId);
    const mapped = await Promise.all(orders.map(toCustomerOrder));
    return mapped.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  /** Single order by id. */
  findById: async (id: string): Promise<CustomerOrder | null> => {
    try {
      const order = await orderApi.byId(id);
      return await toCustomerOrder(order);
    } catch {
      return null;
    }
  },
};
