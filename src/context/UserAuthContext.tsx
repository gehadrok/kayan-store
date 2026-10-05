import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types.ts';

interface UserAuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

// Automatically intercept window.fetch to include Authorization Bearer header if user token exists
if (typeof window !== 'undefined' && !(window as any).__fetch_intercepted__) {
  (window as any).__fetch_intercepted__ = true;
  try {
    const originalFetch = window.fetch;
    if (originalFetch) {
      const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const userToken = localStorage.getItem('kayan_user_token');
        if (userToken) {
          init = init || {};
          init.headers = init.headers || {};
          if (init.headers instanceof Headers) {
            if (!init.headers.has('Authorization')) {
              init.headers.set('Authorization', `Bearer ${userToken}`);
            }
          } else if (Array.isArray(init.headers)) {
            const hasAuth = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
            if (!hasAuth) {
              init.headers.push(['Authorization', `Bearer ${userToken}`]);
            }
          } else {
            const hasAuth = Object.keys(init.headers).some(k => k.toLowerCase() === 'authorization');
            if (!hasAuth) {
              (init.headers as any)['Authorization'] = `Bearer ${userToken}`;
            }
          }
        }
        return originalFetch(input, init);
      };

      try {
        window.fetch = interceptedFetch;
      } catch (e) {
        try {
          Object.defineProperty(window, 'fetch', {
            value: interceptedFetch,
            writable: true,
            configurable: true
          });
        } catch (defineError) {
          console.warn('Failed to define window.fetch via defineProperty:', defineError);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to globally intercept window.fetch:', err);
  }
}

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kayan_user_token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.status === 401 || !res.ok) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('kayan_user_token');
        return;
      }
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('kayan_user_token');
      }
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('kayan_user_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (newToken: string, userData: User) => {
    localStorage.setItem('kayan_user_token', newToken);
    setToken(newToken);
    setUser(userData);
    // Verify session via /api/auth/me immediately after login
    await refreshUser();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('kayan_user_token');
    }
  };

  return (
    <UserAuthContext.Provider value={{ user, loading, token, login, logout, refreshUser }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within UserAuthProvider');
  }
  return context;
};

