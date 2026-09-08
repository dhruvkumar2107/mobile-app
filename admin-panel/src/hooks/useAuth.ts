'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await authAPI.getProfile();
      const userData = response.data?.data || response.data;
      if (userData && (userData.role === 'admin' || userData.role === 'super_admin')) {
        setUser(userData);
      } else {
        localStorage.removeItem('admin_token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('admin_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data.data || response.data;
      if (userData.role !== 'admin' && userData.role !== 'super_admin') {
        setError('Access denied. Admin account required.');
        setLoading(false);
        return false;
      }
      localStorage.setItem('admin_token', token);
      setUser(userData);
      return true;
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, error, login, logout, checkAuth };
}
