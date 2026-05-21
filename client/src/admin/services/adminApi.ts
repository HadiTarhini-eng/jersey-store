import { http } from '../../services/api/client';
import { endpoints } from '../../services/api/endpoints';
import type {
  AddressSnapshot, AdminCustomer, AdminOrder, ISODate, OrderStatus, PaymentStatus,
} from '../../types';

/**
 * Backend admin view-models — single joined queries on the server replace the
 * old per-user/per-order N+1 fan-out the client used to do.
 */

interface BackendAdminCustomer {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phone:       string | null;
  country:     string | null;
  ordersCount: number;
  totalSpent:  number;
  joinedAt:    ISODate;
  isActive:    boolean;
}

interface BackendAdminOrderItem {
  productVariantId:     string;
  productTitleSnapshot: string;
  size:                 string;
  quantity:             number;
  unitPrice:            number;
  totalPrice:           number;
}

interface BackendAdminOrder {
  id:               string;
  orderNumber:      string;
  customer:         { id: string; firstName: string; lastName: string; email: string };
  items:            BackendAdminOrderItem[];
  itemsCount:       number;
  subtotal:         number;
  shippingAmount:   number;
  totalAmount:      number;
  status:           OrderStatus;
  paymentStatus:    PaymentStatus;
  shippingAddress:  AddressSnapshot;
  billingAddress:   AddressSnapshot;
  createdAt:        ISODate;
  placedAt:         ISODate | null;
}

function mapOrderStatus(status: OrderStatus): AdminOrder['status'] {
  return status === 'confirmed' ? 'processing' : status;
}

function mapPaymentStatus(status: PaymentStatus): AdminOrder['paymentStatus'] {
  return status === 'authorized' || status === 'paid' ? 'paid' : (status as AdminOrder['paymentStatus']);
}

function toAdminCustomer(c: BackendAdminCustomer): AdminCustomer {
  return {
    id:          c.id,
    firstName:   c.firstName,
    lastName:    c.lastName,
    email:       c.email,
    phone:       c.phone ?? undefined,
    country:     c.country ?? undefined,
    ordersCount: c.ordersCount,
    totalSpent:  c.totalSpent,
    joinedAt:    c.joinedAt,
    status:      c.isActive ? 'active' : 'inactive',
  };
}

function toAdminOrder(o: BackendAdminOrder): AdminOrder {
  return {
    id:          o.id,
    orderNumber: o.orderNumber,
    customer: {
      id:    o.customer.id,
      name:  `${o.customer.firstName} ${o.customer.lastName}`.trim(),
      email: o.customer.email,
    },
    items: o.items.map((item) => ({
      productId: item.productVariantId,
      name:      item.productTitleSnapshot,
      size:      item.size,
      quantity:  item.quantity,
      price:     item.unitPrice,
    })),
    subtotal:      o.subtotal,
    shipping:      o.shippingAmount,
    total:         o.totalAmount,
    status:        mapOrderStatus(o.status),
    paymentStatus: mapPaymentStatus(o.paymentStatus),
    shippingAddress: {
      ...o.shippingAddress,
      addressLine2: o.shippingAddress.addressLine2 ?? undefined,
      state:        o.shippingAddress.state ?? undefined,
      postalCode:   o.shippingAddress.postalCode ?? undefined,
    },
    createdAt: o.createdAt,
  };
}

export const adminApi = {
  async listCustomers(): Promise<AdminCustomer[]> {
    const rows = await http.get<BackendAdminCustomer[]>(endpoints.admin.listCustomers());
    return rows.map(toAdminCustomer);
  },

  async listOrders(): Promise<AdminOrder[]> {
    const rows = await http.get<BackendAdminOrder[]>(endpoints.admin.listOrders());
    return rows.map(toAdminOrder);
  },

  async getOrder(id: string): Promise<AdminOrder> {
    const row = await http.get<BackendAdminOrder>(endpoints.admin.getOrder(id));
    return toAdminOrder(row);
  },
};
