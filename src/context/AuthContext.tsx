import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, User } from '@/types';
import { apiClient, setMemoryToken } from '@/api/apiClient';

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

interface MeResponse {
  userId: string;
  email: string;
  role: string;
  departmentId?: string | null;
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

  const fetchUserProfile = async (id: string): Promise<User | null> => {
    try {
      // Auth travels via the HttpOnly cookie (withCredentials) or the
      // in-memory token attached by the interceptor — no explicit header needed.
      const response = await apiClient.get(`/user/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile', error);
      return null;
    }
  };

  const clearSession = () => {
    setMemoryToken(null);
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    setAuthState({ isAuthenticated: false, role: null, token: null, userId: null, isLoading: false, user: null });
  };

  useEffect(() => {
    // SECURITY (F-05): session is restored via the HttpOnly cookie, not localStorage.
    const initAuth = async () => {
      try {
        const me = await apiClient.get<MeResponse>('/auth/me');
        const role = (me.data.role as UserRole) ?? (localStorage.getItem('user_role') as UserRole | null);
        const userId = me.data.userId ?? localStorage.getItem('user_id');
        if (role && userId) {
          const userDetails = await fetchUserProfile(userId);
          setAuthState({
            isAuthenticated: true,
            role,
            token: null, // token lives in the HttpOnly cookie / memory only
            userId,
            user: userDetails,
            isLoading: false,
          });
          return;
        }
      } catch {
        // 401 or network error -> not authenticated
      }
      clearSession();
    };

    initAuth();

    // Global listener for 401 Unauthorized from Axios
    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (token: string, role: UserRole, userId: string) => {
    // Keep the token in memory only (fallback for non-cookie contexts).
    // The HttpOnly cookie set by the API is the primary browser mechanism.
    setMemoryToken(token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_id', userId);
    console.log('login: fetching user profile...');
    const userDetails = await fetchUserProfile(userId);
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
    // Best-effort server-side cookie clearing; local state is cleared regardless.
    apiClient.post('/auth/logout').catch(() => undefined);
    clearSession();
  };

  const refreshUser = async () => {
    if (authState.userId) {
      const userDetails = await fetchUserProfile(authState.userId);
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
