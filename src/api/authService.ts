import apiClient from './apiClient';
import { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  referralCode?: string;
  affiliateCode?: string;
}

export interface AuthResponse {
  verifyStatus?: string;
  token: string;
  user: User;
  referralCode?: string;
  affiliateCode?: string;
  referralLink?: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  resetPassword: async(email: string, newPassword: string): Promise<string> => {
    const response = await apiClient.post('/auth/reset-password', { email, newPassword });
    return response.data;
  },

  sendOtp: async (email: string): Promise<string> => {
    const response = await apiClient.post('/auth/send-email-otp', { email });
    return response.data;
  },

  sendOtpForPasswordReset: async (email: string): Promise<string> => {
    const response = await apiClient.post('/auth/send-email-otp-pwd-reset', { email });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<string> => {
    const response = await apiClient.post('/auth/verify-email-otp', { email, otp });
    return response.data;
  },
};
