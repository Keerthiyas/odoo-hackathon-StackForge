import { apiClient } from './api';
import { UserModel } from '../types';
import { INITIAL_USERS } from './mockData';

const TOKEN_KEY = 'brightloop_auth_token';
const USER_KEY = 'brightloop_auth_user';
const USERS_STORE_KEY = 'brightloop_users_v3';

function getStoredUsers(): UserModel[] {
  try {
    const item = localStorage.getItem(USERS_STORE_KEY);
    if (!item) {
      localStorage.setItem(USERS_STORE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(item) as UserModel[];
  } catch {
    return INITIAL_USERS;
  }
}

function setStoredUsers(users: UserModel[]): void {
  try {
    localStorage.setItem(USERS_STORE_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Could not persist users:', err);
  }
}

export const authService = {
  // Attach token to Authorization header
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser(): UserModel | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) return JSON.parse(userStr);
      return null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(USER_KEY);
  },

  async login(email: string, password?: string): Promise<{ user: UserModel; token: string }> {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data?.token && res.data?.user) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        return res.data;
      }
    } catch {
      // Backend unavailable; authenticate against local store
    }

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error(`No account found with email: ${email}. Please register or check spelling.`);
    }

    const mockToken = `jwt_mock_${user._id}_${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, token: mockToken };
  },

  async register(data: {
    name: string;
    email: string;
    password?: string;
    company?: string;
    role?: 'customer' | 'admin' | 'staff';
    phone?: string;
  }): Promise<{ user: UserModel; token: string }> {
    try {
      const res = await apiClient.post('/auth/register', data);
      if (res.data?.token && res.data?.user) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        return res.data;
      }
    } catch {
      // Backend unavailable; persist locally
    }

    const users = getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error(`An account with email ${data.email} already exists.`);
    }

    const randomHex = Math.random().toString(16).substring(2, 10) + Date.now().toString(16).padStart(16, '0');
    const newUser: UserModel = {
      _id: randomHex.substring(0, 24),
      name: data.name,
      email: data.email,
      role: data.role || 'customer',
      company: data.company || 'Enterprise Org',
      phone: data.phone || '+1 (555) 019-2831',
    };

    const updated = [...users, newUser];
    setStoredUsers(updated);

    const mockToken = `jwt_mock_${newUser._id}_${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));

    return { user: newUser, token: mockToken };
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getAllUsers(): UserModel[] {
    return getStoredUsers();
  },
};

// Configure Axios Authorization header interceptor
apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
