import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authUtils } from '../utils/auth';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => authUtils.getCurrentUser());
  const [token, setTokenState] = useState<string | null>(() => authUtils.getToken());

  useEffect(() => {
    const user = authUtils.getCurrentUser();
    const storedToken = authUtils.getToken();
    setCurrentUserState(user);
    setTokenState(storedToken);
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    authUtils.setCurrentUser(user);
  };

  const login = (user: User) => {
    setCurrentUserState(user);
    authUtils.setCurrentUser(user);
    const storedToken = authUtils.getToken();
    setTokenState(storedToken);
  };

  const logout = () => {
    setCurrentUser(null);
    setTokenState(null);
    authUtils.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        isAuthenticated: !!currentUser && !!token,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

