import { http } from './client';
import { endpoints } from './endpoints';
import type {
  AddressSnapshot, CreateGuestOrderPayload, CreateOrderPayload, GuestOrderResponse,
  Order, OrderItem, OrderStatus, PaymentStatus,
} from '../../types';

export const orderApi = {
  create:        (body: CreateOrderPayload)        => http.post<Order>(endpoints.orders.create(), body),
  /** Anonymous one-shot checkout. Server resolves prices + totals. */
  createGuest:   (body: CreateGuestOrderPayload)   => http.post<GuestOrderResponse>(endpoints.orders.guest(), body),
  byId:          (id: string)                      => http.get<Order>(endpoints.orders.byId(id)),
  byNumber:      (orderNumber: string)             => http.get<Order>(endpoints.orders.byNumber(orderNumber)),
  forUser:       (userId: string)                  => http.get<Order[]>(endpoints.orders.forUser(userId)),
  items:         (id: string)                      => http.get<OrderItem[]>(endpoints.orders.items(id)),
  place:         (id: string)                      => http.post<Order>(endpoints.orders.place(id)),
  /**
   * Admin-only. Pass `rejectionReason` when moving to `cancelled` — server
   * enforces the strict transition graph and rejects empty reasons.
   */
  updateStatus:  (id: string, status: OrderStatus, rejectionReason?: string | null) =>
                   http.patch<Order>(endpoints.orders.status(id), { status, rejectionReason: rejectionReason ?? null }),
  /** Customer dismisses an unread rejection message — clears the unread dot. */
  markMessageRead: (id: string)                    => http.post<Order>(endpoints.orders.markMessageRead(id)),
  updatePayment: (id: string, paymentStatus: PaymentStatus) =>
                   http.patch<Order>(endpoints.orders.payment(id), { paymentStatus }),
  updateAddresses:(id: string, addresses: { shippingAddress: AddressSnapshot; billingAddress: AddressSnapshot }) =>
                   http.patch<Order>(endpoints.orders.addresses(id), addresses),
  /** Cancel an order (customer or admin). Optional message shown to the customer, like a reject. */
  cancel:        (id: string, reason?: string | null) => http.post<Order>(endpoints.orders.cancel(id), { reason: reason ?? null }),
};
