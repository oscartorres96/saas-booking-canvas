import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import apiClient, { setUnauthorizedHandler } from '../api/axiosConfig';
import { clearAuthStorage, getAccessToken, setTokens } from '../utils/storage';

interface AuthUser {
  userId?: string;
  email?: string;
  role?: string;
  businessId?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name: string) => Promise<AuthUser>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setAccessToken(null);
  }, []);

  const loadProfile = useCallback(
    async (token?: string) => {
      try {
        setLoading(true);
        if (token) {
          apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
        const profile = await authApi.getProfile();
        setUser(profile as AuthUser);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    },
    [logout],
  );

  useEffect(() => {
    setUnauthorizedHandler(logout);
    const storedToken = getAccessToken();
    if (storedToken) {
      setAccessToken(storedToken);
      loadProfile(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadProfile, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setTokens(data.accessToken, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user as AuthUser);
    return data.user as AuthUser;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await authApi.register(email, password, name);
    setTokens(data.accessToken, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user as AuthUser);
    return data.user as AuthUser;
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    await loadProfile(token);
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [accessToken, loading, login, logout, register, refreshProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
