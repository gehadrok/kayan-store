import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types.ts';

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  token: string | null;
  login: (token: string, admin: AdminUser) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kayan_admin_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('kayan_admin_token');
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/admin/me', { headers });
      const data = await res.json();
      if (data.success && data.admin) {
        setAdmin(data.admin);
      } else {
        setAdmin(null);
        localStorage.removeItem('kayan_admin_token');
        setToken(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (newToken: string, adminUser: AdminUser) => {
    setToken(newToken);
    setAdmin(adminUser);
    localStorage.setItem('kayan_admin_token', newToken);
  };

  const logout = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/admin/logout', { method: 'POST', headers });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('kayan_admin_token');
    }
  };

  return (
    <AuthContext.Provider value={{ admin, loading, token, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
