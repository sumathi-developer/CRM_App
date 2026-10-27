import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth.types';
import { authService, type LoginParams, type RegisterParams, type UpdateProfileParams } from '../services/auth.service';
import { api } from '../services/api';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
  updateProfile: (data: UpdateProfileParams) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('crm_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and check current user session
  const initAuth = useCallback(async () => {
    const token = api.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch (err) {
      console.warn('Initial session check failed:', err);
      // If token is invalid and refresh failed, clear user
      if (!api.getAccessToken()) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [initAuth]);

  const login = async (params: LoginParams) => {
    const result = await authService.login(params);
    setUser(result.user);
  };

  const register = async (params: RegisterParams) => {
    const result = await authService.register(params);
    if (result.user) {
      setUser(result.user);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshProfile = async (): Promise<User | null> => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      return freshUser;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      return null;
    }
  };

  const updateProfile = async (data: UpdateProfileParams): Promise<User> => {
    if (!user) throw new Error('No active user to update');
    const updated = await authService.updateProfile(user.id, data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!api.getAccessToken(),
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth';
