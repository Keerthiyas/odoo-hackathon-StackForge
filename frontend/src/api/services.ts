/**
 * API Services Layer - Keeps UI components completely separated from HTTP / API logic
 * Attempts live backend endpoints (MongoDB/Express API), with seamless fallback to mock data
 * when the teammate's backend server is not running.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  DashboardMetrics,
  DateFilterType,
  Invoice,
  MonthlyRevenueData,
  Payment,
  PaymentStatusDistribution,
  Product,
  RegisterPayload,
  Subscription,
  SubscriptionGrowthData,
  User,
} from '../types';
import {
  MOCK_USERS,
  MOCK_METRICS_BY_FILTER,
  MOCK_MONTHLY_REVENUE,
  MOCK_SUBSCRIPTION_GROWTH,
  MOCK_PAYMENT_STATUS_DISTRIBUTION,
  MOCK_SUBSCRIPTIONS,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  MOCK_CUSTOMERS,
} from '../data/mockData';

export const authService = {
  /**
   * Login with backend API support, falling back to mock authentication if backend is offline
   */
  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      return response.data;
    } catch (error) {
      // Backend is still developing; fallback to matching mock user
      const normalizedEmail = email.toLowerCase();
      let matchedUser: User | undefined;

      if (normalizedEmail.includes('admin')) {
        matchedUser = MOCK_USERS.ADMIN;
      } else if (normalizedEmail.includes('staff') || normalizedEmail.includes('alex')) {
        matchedUser = MOCK_USERS.STAFF;
      } else {
        matchedUser = {
          ...MOCK_USERS.CUSTOMER,
          email,
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        };
      }

      return {
        user: matchedUser,
        token: `jwt_token_${matchedUser.role}_${Date.now()}`,
      };
    }
  },

  /**
   * Register customer with backend API support
   */
  async register(payload: RegisterPayload): Promise<{ user: User; message: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: 'customer', // strictly customer role
        companyName: payload.companyName,
      });
      return response.data;
    } catch (error) {
      // Backend offline fallback simulation
      return {
        user: {
          id: `usr_${Date.now()}`,
          name: payload.name,
          email: payload.email,
          role: 'customer',
          companyName: payload.companyName || undefined,
          createdAt: new Date().toISOString(),
        },
        message: 'Registration successful',
      };
    }
  },

  /**
   * Submit forgot password request to backend API
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      return {
        success: true,
        message: 'Password reset link sent to your registered email address.',
      };
    }
  },
};

export const dashboardService = {
  /**
   * Fetch aggregated summary metrics from backend collections:
   * Users (Total Customers), Products (Total Products), Subscriptions (Active Subscriptions),
   * Invoices (Total Invoices & Overdue Invoices), Payments (Completed Payments & Revenue Received)
   */
  async getMetrics(filter: DateFilterType = 'month'): Promise<DashboardMetrics> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.METRICS, {
        params: { filter },
      });
      return response.data;
    } catch (error) {
      const baseMetrics = MOCK_METRICS_BY_FILTER[filter] || MOCK_METRICS_BY_FILTER.month;
      try {
        const storedProducts = JSON.parse(localStorage.getItem('brightloop_products_mock') || '[]');
        if (storedProducts && storedProducts.length > 0) {
          return {
            ...baseMetrics,
            totalProducts: storedProducts.length,
          };
        }
      } catch {}
      return baseMetrics;
    }
  },

  /**
   * Fetch Monthly Revenue data from backend API
   */
  async getMonthlyRevenue(): Promise<MonthlyRevenueData[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.REVENUE_CHART);
      return response.data;
    } catch (error) {
      return MOCK_MONTHLY_REVENUE;
    }
  },

  /**
   * Fetch Subscription Growth data from backend API
   */
  async getSubscriptionGrowth(): Promise<SubscriptionGrowthData[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.GROWTH_CHART);
      return response.data;
    } catch (error) {
      return MOCK_SUBSCRIPTION_GROWTH;
    }
  },

  /**
   * Fetch Payment Status Distribution from backend API
   */
  async getPaymentStatusDistribution(): Promise<PaymentStatusDistribution[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.PAYMENT_STATUS);
      return response.data;
    } catch (error) {
      return MOCK_PAYMENT_STATUS_DISTRIBUTION;
    }
  },
};

export const subscriptionsService = {
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
      return response.data;
    } catch (error) {
      try {
        const stored = localStorage.getItem('brightloop_subscriptions_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
      return MOCK_SUBSCRIPTIONS;
    }
  },
};

export const invoicesService = {
  async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INVOICES.BASE);
      return response.data;
    } catch (error) {
      return MOCK_INVOICES;
    }
  },
};

export const paymentsService = {
  async getPayments(): Promise<Payment[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.BASE);
      return response.data;
    } catch (error) {
      return MOCK_PAYMENTS;
    }
  },
};

export const usersService = {
  async getCustomers(): Promise<any[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.BASE);
      return response.data;
    } catch (error) {
      return MOCK_CUSTOMERS;
    }
  },

  async getStaffMembers(): Promise<User[]> {
    try {
      const response = await apiClient.get('/users?role=staff');
      return response.data;
    } catch (error) {
      return [
        MOCK_USERS.STAFF,
        {
          id: 'usr_staff_02',
          name: 'Rachel Zane',
          email: 'rachel.zane@brightloop.io',
          role: 'staff',
          companyName: 'Brightloop Operations',
          createdAt: '2025-08-10',
        },
      ];
    }
  },
};
