import api from './api';
import type { ApiResponse, Order, ShippingAddress, CartItem } from '../types';

export interface CreateOrderPayload {
  items: CartItem[];
  shippingAddress: ShippingAddress;
}

export const orderService = {
  createOrder: async (payload: CreateOrderPayload) => {
    const { data } = await api.post<ApiResponse<Order>>('/orders', payload);
    return data.data;
  },

  getOrder: async (orderId: string) => {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return data.data;
  },

  getUserOrders: async () => {
    const { data } = await api.get<ApiResponse<Order[]>>('/orders');
    return data.data;
  },
};
