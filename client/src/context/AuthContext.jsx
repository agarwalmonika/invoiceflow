import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token) { setLoading(false); setInitialized(true); return; }
    try {
      if (savedUser) setUser(JSON.parse(savedUser));
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally { setLoading(false); setInitialized(true); }
  }, []);

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user, loading, initialized,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!user,
      login, register, logout, updateUser,
      refetch: initializeAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
