/**
 * API Endpoints configuration for Brightloop Software Subscription Management
 * Matches future backend endpoints developed for MongoDB + Express backend.
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
  },
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    REVENUE_CHART: '/dashboard/revenue-chart',
    GROWTH_CHART: '/dashboard/growth-chart',
    PAYMENT_STATUS: '/dashboard/payment-status',
  },
  SUBSCRIPTIONS: {
    BASE: '/subscriptions',
    BY_ID: (id: string) => `/subscriptions/${id}`,
    PAUSE: (id: string) => `/subscriptions/${id}/pause`,
    RESUME: (id: string) => `/subscriptions/${id}/resume`,
    CLOSE: (id: string) => `/subscriptions/${id}/close`,
    CANCEL: (id: string) => `/subscriptions/${id}/cancel`,
    UPGRADE: (id: string) => `/subscriptions/${id}/upgrade`,
  },
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: string) => `/customers/${id}`,
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
  },
  PLANS: {
    BASE: '/plans',
    BY_ID: (id: string) => `/plans/${id}`,
  },
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id: string) => `/invoices/${id}`,
    DOWNLOAD: (id: string) => `/invoices/${id}/download`,
  },
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: string) => `/payments/${id}`,
  },
  QUOTATIONS: {
    BASE: '/quotations',
    BY_ID: (id: string) => `/quotations/${id}`,
    SEND: (id: string) => `/quotations/${id}/send`,
    ACCEPT: (id: string) => `/quotations/${id}/accept`,
    REJECT: (id: string) => `/quotations/${id}/reject`,
  },
  DISCOUNTS: {
    BASE: '/discounts',
  },
  TAXES: {
    BASE: '/taxes',
  },
  SETTINGS: {
    ORGANIZATION: '/settings/organization',
    BILLING: '/settings/billing',
  },
} as const;
