import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { login as apiLogin, getCurrentUser as apiGetCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set auth header helper
  const setAuthHeader = (token) => {
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common['Authorization'];
    }
  };

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      setAuthHeader(token);
      try {
        const currentUser = await apiGetCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        setAuthHeader(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      const token = data.access_token;
      localStorage.setItem('token', token);
      setAuthHeader(token);
      
      // Fetch user profile info
      const currentUser = await apiGetCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      // Clean up headers and storage on failure
      localStorage.removeItem('token');
      setAuthHeader(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setAuthHeader(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        loading,
        loginUser,
        logoutUser,
      }}
    >
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
