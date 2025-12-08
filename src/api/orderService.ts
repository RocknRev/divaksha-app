import apiClient from './apiClient';
import { Order, PagedResponse, CreateOrderRequest, OrderResponse } from '../types';

export const orderService = {
  /**
   * Unified order submission endpoint for both single and multi-item orders
   * @param orderData - Order data with items array (single item = array of length 1)
   * @returns OrderResponse with order details
   */
  submitOrder: async (orderData: CreateOrderRequest): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>('/orders/submit', orderData);
    return response.data;
  },

  /**
   * @deprecated Use submitOrder instead. This method is kept for backward compatibility.
   */
  createOrder: async (orderData: CreateOrderRequest): Promise<OrderResponse> => {
    return orderService.submitOrder(orderData);
  },

  /**
   * @deprecated Use submitOrder instead. This method is kept for backward compatibility.
   */
  submitCartOrder: async (orderData: CreateOrderRequest): Promise<OrderResponse> => {
    return orderService.submitOrder(orderData);
  },

  listOrders: async (status?: string, page: number = 0, size: number = 20): Promise<PagedResponse<Order>> => {
    const params: any = { page, size };
    if (status) params.status = status;
    const response = await apiClient.get('/orders', { params });
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

