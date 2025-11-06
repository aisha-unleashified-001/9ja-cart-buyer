import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartSync } from '../hooks/useCartSync';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuthStatus } = useAuthStore();
  
  // Initialize cart sync with auth state
  useCartSync();

  // Initialize auth status on app startup
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return <>{children}</>;
};

export default AuthProvider;