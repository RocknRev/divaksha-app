import apiClient from './apiClient';
import { User, ReferralTreeNode } from '../types';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  registerUser: async (username: string, referralCode?: number, email?: string, phone?: string): Promise<User> => {
    const response = await apiClient.post('/users/register', {
      username,
      referralCode,
      email,
      phone,
    });
    return response.data;
  },

  getReferralTree: async (id: number): Promise<ReferralTreeNode> => {
    const response = await apiClient.get(`/users/tree/${id}`);
    return response.data;
  },

  activateUser: async (id: number): Promise<void> => {
    await apiClient.post(`/users/admin/activate/${id}`);
  },

  deactivateUser: async (id: number): Promise<void> => {
    await apiClient.post(`/users/admin/deactivate/${id}`);
  },
};

