import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api, setToken, clearToken, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, fullName?: string, onboardingPath?: 'launch' | 'intelligence') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('nexus-token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('nexus-token');
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api<User>('/auth/me');
      setUser(u);
    } catch {
      clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.access_token);
    setTokenState(res.access_token);
    const u = await api<User>('/auth/me');
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullName?: string,
      onboardingPath?: 'launch' | 'intelligence'
    ) => {
      await api<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || null,
          onboarding_path: onboardingPath || null,
        }),
      });
      await login(email, password);
    },
    [login]
  );

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
