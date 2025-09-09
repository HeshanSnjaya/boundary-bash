import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorMessage } from '../services/api';

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          // token exists; trust login flow to set user after next successful call if needed
        }
      } finally {
        setBootstrapping(false);
      }
    };
    load();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await api.login(credentials);
      if (data?.success && data?.user) setUser(data.user);
      return data;
    } catch (e) {
      throw new Error(getApiErrorMessage(e, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const hasPermission = (perm) => !!user?.permissions?.[perm];

  return (
    <AuthCtx.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        bootstrapping,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
