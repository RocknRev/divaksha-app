import apiClient from './apiClient';
import { Order, CreateOrderRequest, PagedResponse } from '../types';

export const orderService = {
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  listOrders: async (status?: string, page: number = 0, size: number = 20, ): Promise<PagedResponse<Order>> => {
    const params: any = { page, size };
    if (status) params.status = status;
    const response = await apiClient.get('/orders', {params});
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/statusUpdate`, { status, orderId });
    return response.data;
  },
};

