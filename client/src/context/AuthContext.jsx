import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('fixmycampus_token'));
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.auth.getMe();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.auth.login({ email, password });
    if (response.success && response.token) {
      localStorage.setItem('fixmycampus_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error(response.error || 'Login failed.');
  };

  const register = async (name, email, password) => {
    const response = await api.auth.register({ name, email, password });
    if (response.success && response.token) {
      localStorage.setItem('fixmycampus_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error(response.error || 'Registration failed.');
  };

  const logout = () => {
    localStorage.removeItem('fixmycampus_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
