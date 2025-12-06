import { User } from '../types';

export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role?.toLowerCase() === 'admin' || user.username?.toLowerCase() === 'admin';
};

