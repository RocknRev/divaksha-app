import { User } from '../types';

const USER_STORAGE_KEY = 'divaksha_current_user';
const TOKEN_STORAGE_KEY = 'divaksha_auth_token';
const REFERRAL_STORAGE_KEY = 'divaksha_referral_id';

export const authUtils = {
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  setToken: (token: string | null): void => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },

  getReferralId: (): number | null => {
    try {
      const refId = localStorage.getItem(REFERRAL_STORAGE_KEY);
      return refId ? parseInt(refId, 10) : null;
    } catch {
      return null;
    }
  },

  setReferralId: (userId: number | null): void => {
    if (userId) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, userId.toString());
    } else {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
    }
  },

  clearReferralId: (): void => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  },

  logout: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  },
};

