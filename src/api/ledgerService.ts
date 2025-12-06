import apiClient from './apiClient';
import { CommissionLedger, PagedResponse } from '../types';

export const ledgerService = {
  // listLedger: async (page: number = 0, size: number = 20): Promise<PagedResponse<CommissionLedger>> => {
  //   const response = await apiClient.get('/admin/ledger', {
  //     params: { page, size },
  //   });
  //   return response.data;
  // },
  listLedger: async (page: number = 0, size: number = 20, beneficiaryUserId?: number): Promise<PagedResponse<CommissionLedger>> => {
    const params: any = { page, size };
    if (beneficiaryUserId) params.beneficiaryUserId = beneficiaryUserId;
    const response = await apiClient.get('/admin/ledger', {params});
    return response.data;
  },

  getUserLedger: async (userId: number, page: number = 0, size: number = 20): Promise<PagedResponse<CommissionLedger>> => {
    const response = await apiClient.get(`/users/ledger/${userId}`, {
      params: { page, size },
    });
    return response.data;
  },
};

