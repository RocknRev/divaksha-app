import apiClient from './apiClient';

export interface AffiliateInfo {
  affiliateUserId: number;
  code: string;
  username: string;
}

export const affiliateService = {
  validateAffiliateCode: async (code: string): Promise<AffiliateInfo> => {
    const response = await apiClient.get<AffiliateInfo>(`/affiliate/${code}`);
    return response.data;
  },
};

