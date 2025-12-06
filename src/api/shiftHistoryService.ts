import apiClient from './apiClient';
import { ReferralShiftHistory, PagedResponse } from '../types';

export const shiftHistoryService = {
  listShiftHistory: async (page: number = 0, size: number = 20): Promise<PagedResponse<ReferralShiftHistory>> => {
    const response = await apiClient.get('/admin/shift-history', {
      params: { page, size },
    });
    return response.data;
  },
};

