import apiClient from './apiClient';
import { Product } from '../types';

export const productService = {
  getAllProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getProductById: async (productId: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  },
};

