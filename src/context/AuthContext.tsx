import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, User } from '@/types';
import { apiClient } from '@/api/apiClient';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  token: string | null;
  userId: string | null;
  user: User | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, role: UserRole, userId: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    token: null,
    userId: null,
    user: null,
    isLoading: true,
  });

  const fetchUserProfile = async (id: string, token: string): Promise<User | null> => {
    try {
      const response = await apiClient.get(`/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile', error);
      return null;
    }
  };

  useEffect(() => {
    // Check local storage on mount
    const initAuth = async () => {
      const token = localStorage.getItem('jwt_token');
      const role = localStorage.getItem('user_role') as UserRole | null;
      const userId = localStorage.getItem('user_id');

      if (token && role && userId) {
        console.log('initAuth: fetching user profile...');
        const userDetails = await fetchUserProfile(userId, token);
        console.log('initAuth: fetchUserProfile done. userDetails:', userDetails ? 'found' : 'null');
        if (userDetails) {
          setAuthState({
            isAuthenticated: true,
            role,
            token,
            userId,
            user: userDetails,
            isLoading: false,
          });
        } else {
          // Token exists but user is not found (e.g., deleted from database). Force logout.
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_id');
          setAuthState({ isAuthenticated: false, role: null, token: null, userId: null, isLoading: false, user: null });
        }
      } else {
        setAuthState({ isAuthenticated: false, role: null, token: null, userId: null, isLoading: false, user: null });
      }
    };

    initAuth();

    // Global listener for 401 Unauthorized from Axios
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (token: string, role: UserRole, userId: string) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_id', userId);
    console.log('login: fetching user profile...');
    const userDetails = await fetchUserProfile(userId, token);
    console.log('login: fetchUserProfile done. userDetails:', userDetails ? 'found' : 'null');

    setAuthState({
      isAuthenticated: true,
      role,
      token,
      userId,
      user: userDetails,
      isLoading: false,
    });
    console.log('login: set isAuthenticated to true');
  };

  const logout = () => {
    console.log('logout called');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    setAuthState({ isAuthenticated: false, role: null, token: null, userId: null, isLoading: false, user: null });
  };

  const refreshUser = async () => {
    if (authState.userId && authState.token) {
      const userDetails = await fetchUserProfile(authState.userId, authState.token);
      setAuthState(prev => ({ ...prev, user: userDetails }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, refreshUser }}>
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
