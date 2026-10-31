import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_USERS } from '../data/mockData';
import { User, UserRole } from '../types';
import { authService } from '../api/services';

interface AuthContextType {
  user: User | null;
  role: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, requestedRole?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('brightloop_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    // Default to admin for seamless exploration
    return MOCK_USERS.ADMIN;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('brightloop_user', JSON.stringify(user));
      const currentRole = (user.role || 'admin').toLowerCase();
      localStorage.setItem('brightloop_auth_token', `token_${currentRole}_${Date.now()}`);
    } else {
      localStorage.removeItem('brightloop_user');
      localStorage.removeItem('brightloop_auth_token');
    }
  }, [user]);

  /**
   * Login supports backend API authentication via authService.login
   */
  const login = async (
    email: string,
    password?: string,
    requestedRole?: UserRole
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      let authUser = result.user;

      if (requestedRole) {
        const normRole = requestedRole.toLowerCase() as UserRole;
        authUser = {
          ...authUser,
          role: normRole,
        };
      }

      setUser(authUser);
      if (result.token) {
        localStorage.setItem('brightloop_auth_token', result.token);
      }
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('brightloop_user');
    localStorage.removeItem('brightloop_auth_token');
  };

  const switchRole = (newRole: string) => {
    const key = newRole.toUpperCase() as keyof typeof MOCK_USERS;
    const newUser = MOCK_USERS[key] || {
      ...MOCK_USERS.ADMIN,
      role: newRole.toLowerCase() as UserRole,
    };
    setUser(newUser);
  };

  const role = (user?.role || 'admin').toLowerCase();
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
