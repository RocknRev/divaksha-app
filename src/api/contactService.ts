import apiClient from './apiClient';

export interface ContactQueryRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactQueryResponse {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status?: string;
}

export const contactService = {
  sendQuery: async (queryData: ContactQueryRequest): Promise<ContactQueryResponse> => {
    const response = await apiClient.post<ContactQueryResponse>('/contact/query', queryData);
    return response.data;
  },
};

