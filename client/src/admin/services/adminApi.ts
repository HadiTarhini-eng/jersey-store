import { orderApi, userApi } from '../../services/api';
import type { AdminCustomer, AdminOrder, Order, OrderItem, PaymentStatus, User } from '../../types';

function toOrderStatus(status: Order['status']): AdminOrder['status'] {
  if (status === 'confirmed') return 'processing';
  return status;
}

function toPaymentStatus(status: PaymentStatus): AdminOrder['paymentStatus'] {
  if (status === 'authorized' || status === 'paid') return 'paid';
  return status;
}

function getItemSize(snapshot: Record<string, unknown>) {
  const label = snapshot.label;
  return typeof label === 'string' && label.trim() ? label : 'Standard';
}

function mapOrder(order: Order, user: User, items: OrderItem[]): AdminOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
    },
    items: items.map((item) => ({
      productId: item.productVariantId,
      name: item.productTitleSnapshot,
      size: getItemSize(item.variantSnapshot),
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    subtotal: order.subtotal,
    shipping: order.shippingAmount,
    total: order.totalAmount,
    status: toOrderStatus(order.status),
    paymentStatus: toPaymentStatus(order.paymentStatus),
    shippingAddress: {
      ...order.shippingAddress,
      addressLine2: order.shippingAddress.addressLine2 ?? undefined,
      state: order.shippingAddress.state ?? undefined,
      postalCode: order.shippingAddress.postalCode ?? undefined,
    },
    createdAt: order.createdAt,
  };
}

export const adminApi = {
  async listCustomers(): Promise<AdminCustomer[]> {
    const users = await userApi.list();
    const customers = users.filter((user) => user.role === 'User');

    return Promise.all(customers.map(async (user) => {
      const orders = await orderApi.forUser(user.id).catch(() => []);
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? undefined,
        country: orders[0]?.shippingAddress.country,
        ordersCount: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        joinedAt: user.createdAt,
        status: user.isActive ? 'active' : 'inactive',
      } satisfies AdminCustomer;
    }));
  },

  async listOrders(): Promise<AdminOrder[]> {
    const users = await userApi.list();
    const customers = users.filter((user) => user.role === 'User');

    const perUserOrders = await Promise.all(customers.map(async (user) => {
      const orders = await orderApi.forUser(user.id).catch(() => []);
      const mapped = await Promise.all(orders.map(async (order) => {
        const items = await orderApi.items(order.id).catch(() => []);
        return mapOrder(order, user, items);
      }));
      return mapped;
    }));

    return perUserOrders
      .flat()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
