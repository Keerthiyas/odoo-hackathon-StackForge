/**
 * [SEPARATE MOCK DATA LAYER FOR PHASE 2 - PRODUCTS & PLANS]
 * Follows exact Mongoose schema:
 * Product: _id, name, description, basePrice, isActive, createdAt, updatedAt
 * Plan: _id, product, name, billingCycle (monthly|yearly), price, allowPause, allowRenewal, allowEarlyClose, isActive, createdAt, updatedAt
 */

import { Product, Plan } from '../types';

export const INITIAL_PRODUCTS_MOCK: Product[] = [
  {
    _id: '6620f1a1e4b0a1a2b3c4d001',
    name: 'Cloud Intelligence Suite',
    description: 'Enterprise AI analytics, real-time observability, and smart automation pipelines for mission-critical infrastructure.',
    basePrice: 299,
    isActive: true,
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-02-10T14:20:00.000Z',
    plansCount: 3,
    activeSubscriptions: 842,
  },
  {
    _id: '6620f1a1e4b0a1a2b3c4d002',
    name: 'Data Pipeline Core',
    description: 'High-throughput ETL streaming, multi-cloud synchronization, and distributed database replication engine.',
    basePrice: 199,
    isActive: true,
    createdAt: '2026-02-01T10:15:00.000Z',
    updatedAt: '2026-03-05T09:45:00.000Z',
    plansCount: 2,
    activeSubscriptions: 412,
  },
  {
    _id: '6620f1a1e4b0a1a2b3c4d003',
    name: 'Fleet Analytics Pro',
    description: 'Telematics, routing efficiency, vehicle maintenance tracking, and predictive diagnostics for enterprise fleets.',
    basePrice: 499,
    isActive: true,
    createdAt: '2026-02-20T11:00:00.000Z',
    updatedAt: '2026-02-20T11:00:00.000Z',
    plansCount: 2,
    activeSubscriptions: 174,
  },
  {
    _id: '6620f1a1e4b0a1a2b3c4d004',
    name: 'CyberGuard Perimeter Shield',
    description: 'Automated threat detection, DDoS mitigation, and continuous vulnerability scanning for web services.',
    basePrice: 350,
    isActive: true,
    createdAt: '2026-03-01T16:20:00.000Z',
    updatedAt: '2026-03-12T11:30:00.000Z',
    plansCount: 2,
    activeSubscriptions: 210,
  },
  {
    _id: '6620f1a1e4b0a1a2b3c4d005',
    name: 'Legacy Sync Connector',
    description: 'Deprecated batch sync adapter for legacy mainframe protocols. Maintained for archival integrations.',
    basePrice: 99,
    isActive: false,
    createdAt: '2025-11-10T09:00:00.000Z',
    updatedAt: '2026-01-05T12:00:00.000Z',
    plansCount: 1,
    activeSubscriptions: 0,
  },
];

export const INITIAL_PLANS_MOCK: Plan[] = [
  {
    _id: '6620f2b2e4b0a1a2b3c4e001',
    product: '6620f1a1e4b0a1a2b3c4d001', // Cloud Intelligence Suite
    name: 'Starter Cloud Tier',
    billingCycle: 'monthly',
    price: 299,
    allowPause: false,
    allowRenewal: true,
    allowEarlyClose: false,
    isActive: true,
    createdAt: '2026-01-16T09:00:00.000Z',
    updatedAt: '2026-01-16T09:00:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e002',
    product: '6620f1a1e4b0a1a2b3c4d001', // Cloud Intelligence Suite
    name: 'Growth Cloud Enterprise',
    billingCycle: 'yearly',
    price: 2990,
    allowPause: true,
    allowRenewal: true,
    allowEarlyClose: true,
    isActive: true,
    createdAt: '2026-01-16T09:30:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e003',
    product: '6620f1a1e4b0a1a2b3c4d001', // Cloud Intelligence Suite
    name: 'Scale High-Volume',
    billingCycle: 'monthly',
    price: 799,
    allowPause: true,
    allowRenewal: true,
    allowEarlyClose: false,
    isActive: true,
    createdAt: '2026-01-20T14:00:00.000Z',
    updatedAt: '2026-01-20T14:00:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e004',
    product: '6620f1a1e4b0a1a2b3c4d002', // Data Pipeline Core
    name: 'Pipeline Standard',
    billingCycle: 'monthly',
    price: 199,
    allowPause: false,
    allowRenewal: true,
    allowEarlyClose: false,
    isActive: true,
    createdAt: '2026-02-02T11:00:00.000Z',
    updatedAt: '2026-02-02T11:00:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e005',
    product: '6620f1a1e4b0a1a2b3c4d002', // Data Pipeline Core
    name: 'Pipeline Annual Dedicated',
    billingCycle: 'yearly',
    price: 1990,
    allowPause: true,
    allowRenewal: true,
    allowEarlyClose: true,
    isActive: true,
    createdAt: '2026-02-05T15:30:00.000Z',
    updatedAt: '2026-02-05T15:30:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e006',
    product: '6620f1a1e4b0a1a2b3c4d003', // Fleet Analytics Pro
    name: 'Fleet Logistics Monthly',
    billingCycle: 'monthly',
    price: 499,
    allowPause: false,
    allowRenewal: true,
    allowEarlyClose: false,
    isActive: true,
    createdAt: '2026-02-21T08:00:00.000Z',
    updatedAt: '2026-02-21T08:00:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e007',
    product: '6620f1a1e4b0a1a2b3c4d003', // Fleet Analytics Pro
    name: 'Fleet Multi-Depot Yearly',
    billingCycle: 'yearly',
    price: 4990,
    allowPause: true,
    allowRenewal: true,
    allowEarlyClose: true,
    isActive: true,
    createdAt: '2026-02-22T13:45:00.000Z',
    updatedAt: '2026-02-22T13:45:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e008',
    product: '6620f1a1e4b0a1a2b3c4d004', // CyberGuard Perimeter Shield
    name: 'CyberGuard Standard Defenses',
    billingCycle: 'monthly',
    price: 350,
    allowPause: false,
    allowRenewal: true,
    allowEarlyClose: false,
    isActive: true,
    createdAt: '2026-03-02T10:00:00.000Z',
    updatedAt: '2026-03-02T10:00:00.000Z',
  },
  {
    _id: '6620f2b2e4b0a1a2b3c4e009',
    product: '6620f1a1e4b0a1a2b3c4d005', // Legacy Sync Connector
    name: 'Legacy Maintenance Plan',
    billingCycle: 'monthly',
    price: 99,
    allowPause: false,
    allowRenewal: false,
    allowEarlyClose: true,
    isActive: false,
    createdAt: '2025-11-15T12:00:00.000Z',
    updatedAt: '2026-01-10T16:00:00.000Z',
  },
];

// LocalStorage helpers to support stateful testing without requiring backend DB
const PRODUCT_STORAGE_KEY = 'brightloop_products_data';
const PLAN_STORAGE_KEY = 'brightloop_plans_data';

export const getStoredProducts = (): Product[] => {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS_MOCK;
  const stored = localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_PRODUCTS_MOCK;
    }
  }
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS_MOCK));
  return INITIAL_PRODUCTS_MOCK;
};

export const saveStoredProducts = (products: Product[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
  }
};

export const getStoredPlans = (): Plan[] => {
  if (typeof window === 'undefined') return INITIAL_PLANS_MOCK;
  const stored = localStorage.getItem(PLAN_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_PLANS_MOCK;
    }
  }
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(INITIAL_PLANS_MOCK));
  return INITIAL_PLANS_MOCK;
};

export const saveStoredPlans = (plans: Plan[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
  }
};
