import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  token: string | null;
  userId: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, role: UserRole, userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    token: null,
    userId: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check local storage on mount
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role') as UserRole | null;
    const userId = localStorage.getItem('user_id');

    if (token && role && userId) {
      setAuthState({ isAuthenticated: true, role, token, userId, isLoading: false });
    } else {
      setAuthState({ isAuthenticated: false, role: null, token: null, userId: null, isLoading: false });
    }

    // Global listener for 401 Unauthorized from Axios
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (token: string, role: UserRole, userId: string) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_id', userId);
    setAuthState({ isAuthenticated: true, role, token, userId, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    setAuthState({ isAuthenticated: false, role: null, token: null, userId: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
