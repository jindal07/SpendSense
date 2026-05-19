import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, login as apiLogin, signup as apiSignup, logout as apiLogout } from '@/api/client';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const bootstrap = useCallback(async () => {
    try {
      const data = await fetchMe();
      setUser(data.user);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser((prev) => {
        if (prev) {
          toast.error('Your session has expired. Please sign in again.');
        }
        return null;
      });
      setStatus('unauthenticated');
      qc.clear();
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [qc]);

  const login = useCallback(
    async (credentials) => {
      const data = await apiLogin(credentials);
      setUser(data.user);
      setStatus('authenticated');
      qc.clear();
      return data.user;
    },
    [qc]
  );

  const signup = useCallback(
    async (credentials) => {
      const data = await apiSignup(credentials);
      setUser(data.user);
      setStatus('authenticated');
      qc.clear();
      return data.user;
    },
    [qc]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Clear local state even if the network call fails
    }
    setUser(null);
    setStatus('unauthenticated');
    qc.clear();
  }, [qc]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      login,
      signup,
      logout,
      refresh: bootstrap,
    }),
    [user, status, login, signup, logout, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
