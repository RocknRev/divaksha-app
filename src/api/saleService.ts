import apiClient from './apiClient';
import { Sale, PagedResponse, CreateSaleRequest } from '../types';

export const saleService = {
  listSales: async (page: number = 0, size: number = 20, sellerId?: number): Promise<PagedResponse<Sale>> => {
    const params: any = { page, size };
    if (sellerId) params.sellerId = sellerId;
    const response = await apiClient.get('/sales', {params});
    return response.data;
  },

  createSale: async (saleData: CreateSaleRequest): Promise<Sale> => {
    const response = await apiClient.post('/sales', saleData);
    return response.data;
  },
};

