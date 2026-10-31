/**
 * [SEPARATE MOCK DATA LAYER FOR PHASE 3 - QUOTATIONS & SUBSCRIPTIONS]
 * Follows exact Mongoose schema:
 * Quotation: { customer, product, plan, quantity, unitPrice, totalAmount, status ('draft'|'sent'|'accepted'|'rejected'), validUntil, createdBy }
 * Subscription: { customer, product, plan, quotation, quantity, startDate, nextBillingDate, status ('active'|'paused'|'closed') }
 */

import { Quotation, Subscription } from '../types';
import { getStoredProducts, getStoredPlans } from './productPlanMockData';
import { MOCK_CUSTOMERS, MOCK_USERS } from './mockData';

export const INITIAL_QUOTATIONS_MOCK: Quotation[] = [
  {
    _id: '6620f3c3e4b0a1a2b3c4f001',
    quotationNumber: 'QTE-2026-001',
    customer: 'cust_01', // Cloudscale AI (Elena Rostova)
    product: '6620f1a1e4b0a1a2b3c4d001', // Cloud Intelligence Suite
    plan: '6620f2b2e4b0a1a2b3c4e002', // Growth Cloud Enterprise ($2,990/yr)
    quantity: 2,
    unitPrice: 2990,
    totalAmount: 5980,
    status: 'accepted',
    validUntil: '2026-11-30T23:59:59.000Z',
    createdBy: 'usr_admin_01', // Sarah Chen
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-02T14:30:00.000Z',
  },
  {
    _id: '6620f3c3e4b0a1a2b3c4f002',
    quotationNumber: 'QTE-2026-002',
    customer: 'cust_02', // Vertex Dynamics (David Miller)
    product: '6620f1a1e4b0a1a2b3c4d002', // Data Pipeline Core
    plan: '6620f2b2e4b0a1a2b3c4e004', // Pipeline Standard ($199/mo)
    quantity: 3,
    unitPrice: 199,
    totalAmount: 597,
    status: 'sent',
    validUntil: '2026-12-15T23:59:59.000Z',
    createdBy: 'usr_staff_01', // Alex Mercer
    createdAt: '2026-03-05T11:20:00.000Z',
    updatedAt: '2026-03-05T11:25:00.000Z',
  },
  {
    _id: '6620f3c3e4b0a1a2b3c4f003',
    quotationNumber: 'QTE-2026-003',
    customer: 'cust_04', // Apex Logistics Corp (Tom Reynolds)
    product: '6620f1a1e4b0a1a2b3c4d003', // Fleet Analytics Pro
    plan: '6620f2b2e4b0a1a2b3c4e006', // Fleet Logistics Monthly ($499/mo)
    quantity: 5,
    unitPrice: 499,
    totalAmount: 2495,
    status: 'draft',
    validUntil: '2026-12-31T23:59:59.000Z',
    createdBy: 'usr_admin_01', // Sarah Chen
    createdAt: '2026-03-10T09:15:00.000Z',
    updatedAt: '2026-03-10T09:15:00.000Z',
  },
  {
    _id: '6620f3c3e4b0a1a2b3c4f004',
    quotationNumber: 'QTE-2026-004',
    customer: 'cust_05', // NexaCore Systems (Chloe Kim)
    product: '6620f1a1e4b0a1a2b3c4d004', // CyberGuard Perimeter Shield
    plan: '6620f2b2e4b0a1a2b3c4e008', // CyberGuard Standard Defenses ($350/mo)
    quantity: 1,
    unitPrice: 350,
    totalAmount: 350,
    status: 'accepted',
    validUntil: '2026-11-20T23:59:59.000Z',
    createdBy: 'usr_staff_01', // Alex Mercer
    createdAt: '2026-02-18T14:00:00.000Z',
    updatedAt: '2026-02-20T16:10:00.000Z',
  },
  {
    _id: '6620f3c3e4b0a1a2b3c4f005',
    quotationNumber: 'QTE-2026-005',
    customer: 'cust_03', // Horizon BioLabs (Dr. Marcus Vance)
    product: '6620f1a1e4b0a1a2b3c4d001', // Cloud Intelligence Suite
    plan: '6620f2b2e4b0a1a2b3c4e003', // Scale High-Volume ($799/mo)
    quantity: 1,
    unitPrice: 799,
    totalAmount: 799,
    status: 'rejected',
    validUntil: '2026-02-28T23:59:59.000Z',
    createdBy: 'usr_admin_01', // Sarah Chen
    createdAt: '2026-02-01T15:00:00.000Z',
    updatedAt: '2026-02-10T10:45:00.000Z',
  },
];

export const INITIAL_SUBSCRIPTIONS_MOCK: Subscription[] = [
  {
    _id: '6620f4d4e4b0a1a2b3c4a001',
    subscriptionNumber: 'SUB-2026-001',
    customer: 'cust_01', // Cloudscale AI
    product: '6620f1a1e4b0a1a2b3c4d001', // Cloud Intelligence Suite
    plan: '6620f2b2e4b0a1a2b3c4e002', // Growth Cloud Enterprise (allowPause: true, allowEarlyClose: true)
    quotation: '6620f3c3e4b0a1a2b3c4f001', // QTE-2026-001
    quantity: 2,
    startDate: '2026-03-03T00:00:00.000Z',
    nextBillingDate: '2027-03-03T00:00:00.000Z',
    status: 'active',
    createdAt: '2026-03-03T09:00:00.000Z',
    updatedAt: '2026-03-03T09:00:00.000Z',
  },
  {
    _id: '6620f4d4e4b0a1a2b3c4a002',
    subscriptionNumber: 'SUB-2026-002',
    customer: 'cust_05', // NexaCore Systems
    product: '6620f1a1e4b0a1a2b3c4d004', // CyberGuard Perimeter Shield
    plan: '6620f2b2e4b0a1a2b3c4e008', // CyberGuard Standard Defenses (allowPause: false, allowEarlyClose: false)
    quotation: '6620f3c3e4b0a1a2b3c4f004', // QTE-2026-004
    quantity: 1,
    startDate: '2026-02-21T00:00:00.000Z',
    nextBillingDate: '2026-03-21T00:00:00.000Z',
    status: 'active',
    createdAt: '2026-02-21T10:00:00.000Z',
    updatedAt: '2026-02-21T10:00:00.000Z',
  },
  {
    _id: '6620f4d4e4b0a1a2b3c4a003',
    subscriptionNumber: 'SUB-2026-003',
    customer: 'cust_02', // Vertex Dynamics
    product: '6620f1a1e4b0a1a2b3c4d002', // Data Pipeline Core
    plan: '6620f2b2e4b0a1a2b3c4e005', // Pipeline Annual Dedicated (allowPause: true, allowEarlyClose: true)
    quotation: '6620f3c3e4b0a1a2b3c4f002', // QTE-2026-002
    quantity: 1,
    startDate: '2025-11-15T00:00:00.000Z',
    nextBillingDate: '2026-11-15T00:00:00.000Z',
    status: 'paused',
    createdAt: '2025-11-15T08:00:00.000Z',
    updatedAt: '2026-02-10T12:00:00.000Z',
  },
  {
    _id: '6620f4d4e4b0a1a2b3c4a004',
    subscriptionNumber: 'SUB-2026-004',
    customer: 'cust_03', // Horizon BioLabs
    product: '6620f1a1e4b0a1a2b3c4d003', // Fleet Analytics Pro
    plan: '6620f2b2e4b0a1a2b3c4e007', // Fleet Multi-Depot Yearly (allowPause: true, allowEarlyClose: true)
    quotation: '6620f3c3e4b0a1a2b3c4f005', // QTE-2026-005
    quantity: 1,
    startDate: '2025-06-01T00:00:00.000Z',
    nextBillingDate: '2026-06-01T00:00:00.000Z',
    status: 'closed',
    createdAt: '2025-06-01T14:20:00.000Z',
    updatedAt: '2026-01-15T16:00:00.000Z',
  },
];

const QUOTATION_STORAGE_KEY = 'brightloop_quotations_data';
const SUBSCRIPTION_STORAGE_KEY = 'brightloop_subscriptions_data';

export const getStoredQuotations = (): Quotation[] => {
  if (typeof window === 'undefined') return INITIAL_QUOTATIONS_MOCK;
  const stored = localStorage.getItem(QUOTATION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_QUOTATIONS_MOCK;
    }
  }
  localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(INITIAL_QUOTATIONS_MOCK));
  return INITIAL_QUOTATIONS_MOCK;
};

export const saveStoredQuotations = (quotations: Quotation[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(quotations));
  }
};

export const getStoredSubscriptions = (): Subscription[] => {
  if (typeof window === 'undefined') return INITIAL_SUBSCRIPTIONS_MOCK;
  const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_SUBSCRIPTIONS_MOCK;
    }
  }
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(INITIAL_SUBSCRIPTIONS_MOCK));
  return INITIAL_SUBSCRIPTIONS_MOCK;
};

export const saveStoredSubscriptions = (subscriptions: Subscription[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscriptions));
  }
};

/**
 * Helper to populate quotation references (customer, product, plan, createdBy)
 */
export const populateQuotation = (q: Quotation): Quotation => {
  const products = getStoredProducts();
  const plans = getStoredPlans();
  const customers = MOCK_CUSTOMERS;
  const users = Object.values(MOCK_USERS);

  // Customer resolution
  let customerObj = q.customer;
  if (typeof q.customer === 'string') {
    const custMatch = customers.find((c) => c.id === q.customer || c._id === q.customer);
    if (custMatch) {
      customerObj = {
        _id: custMatch.id || custMatch._id || q.customer,
        name: custMatch.name,
        email: custMatch.email,
        companyName: custMatch.company || custMatch.companyName,
      };
    } else {
      const userMatch = users.find((u) => u.id === q.customer || u._id === q.customer);
      if (userMatch) {
        customerObj = {
          _id: userMatch.id || userMatch._id || q.customer,
          name: userMatch.name,
          email: userMatch.email,
          companyName: userMatch.companyName,
        };
      }
    }
  }

  // Product resolution
  let productObj = q.product;
  if (typeof q.product === 'string') {
    const prodMatch = products.find((p) => p._id === q.product);
    if (prodMatch) {
      productObj = {
        _id: prodMatch._id,
        name: prodMatch.name,
        basePrice: prodMatch.basePrice,
      };
    }
  }

  // Plan resolution
  let planObj = q.plan;
  if (typeof q.plan === 'string') {
    const planMatch = plans.find((pl) => pl._id === q.plan);
    if (planMatch) {
      planObj = {
        _id: planMatch._id,
        name: planMatch.name,
        price: planMatch.price,
        billingCycle: planMatch.billingCycle,
      };
    }
  }

  // CreatedBy resolution
  let createdByObj = q.createdBy;
  if (typeof q.createdBy === 'string') {
    const userMatch = users.find((u) => u.id === q.createdBy || u._id === q.createdBy);
    if (userMatch) {
      createdByObj = {
        _id: userMatch.id || userMatch._id || q.createdBy,
        name: userMatch.name,
        email: userMatch.email,
      };
    }
  }

  return {
    ...q,
    _id: q._id || q.id || `quote_${Date.now()}`,
    customer: customerObj,
    product: productObj,
    plan: planObj,
    createdBy: createdByObj,
  };
};

/**
 * Helper to populate subscription references (customer, product, plan, quotation)
 */
export const populateSubscription = (sub: Subscription): Subscription => {
  const products = getStoredProducts();
  const plans = getStoredPlans();
  const customers = MOCK_CUSTOMERS;
  const users = Object.values(MOCK_USERS);
  const quotations = getStoredQuotations();

  // Customer resolution
  let customerObj = sub.customer;
  if (typeof sub.customer === 'string') {
    const custMatch = customers.find((c) => c.id === sub.customer || c._id === sub.customer);
    if (custMatch) {
      customerObj = {
        _id: custMatch.id || custMatch._id || sub.customer,
        name: custMatch.name,
        email: custMatch.email,
        companyName: custMatch.company || custMatch.companyName,
      };
    } else {
      const userMatch = users.find((u) => u.id === sub.customer || u._id === sub.customer);
      if (userMatch) {
        customerObj = {
          _id: userMatch.id || userMatch._id || sub.customer,
          name: userMatch.name,
          email: userMatch.email,
          companyName: userMatch.companyName,
        };
      }
    }
  }

  // Product resolution
  let productObj = sub.product;
  if (typeof sub.product === 'string') {
    const prodMatch = products.find((p) => p._id === sub.product);
    if (prodMatch) {
      productObj = {
        _id: prodMatch._id,
        name: prodMatch.name,
        basePrice: prodMatch.basePrice,
      };
    }
  }

  // Plan resolution
  let planObj = sub.plan;
  if (typeof sub.plan === 'string') {
    const planMatch = plans.find((pl) => pl._id === sub.plan);
    if (planMatch) {
      planObj = {
        _id: planMatch._id,
        name: planMatch.name,
        price: planMatch.price,
        billingCycle: planMatch.billingCycle,
        allowPause: planMatch.allowPause,
        allowRenewal: planMatch.allowRenewal,
        allowEarlyClose: planMatch.allowEarlyClose,
      };
    }
  }

  // Quotation resolution
  let quotationObj = sub.quotation;
  if (typeof sub.quotation === 'string') {
    const quoteMatch = quotations.find((q) => q._id === sub.quotation);
    if (quoteMatch) {
      quotationObj = {
        _id: quoteMatch._id,
        quotationNumber: quoteMatch.quotationNumber,
        totalAmount: quoteMatch.totalAmount,
      };
    }
  }

  const customerName =
    typeof customerObj === 'object' && customerObj !== null && 'name' in customerObj
      ? (customerObj as any).name
      : sub.customerName;

  const customerEmail =
    typeof customerObj === 'object' && customerObj !== null && 'email' in customerObj
      ? (customerObj as any).email
      : sub.customerEmail;

  const productName =
    typeof productObj === 'object' && productObj !== null && 'name' in productObj
      ? (productObj as any).name
      : sub.productName;

  const planName =
    typeof planObj === 'object' && planObj !== null && 'name' in planObj
      ? (planObj as any).name
      : sub.planName;

  const billingCycle =
    typeof planObj === 'object' && planObj !== null && 'billingCycle' in planObj
      ? (planObj as any).billingCycle
      : sub.billingCycle || 'monthly';

  const planPrice =
    typeof planObj === 'object' && planObj !== null && 'price' in planObj
      ? (planObj as any).price
      : sub.amount || 0;

  const quantity = sub.quantity || 1;

  return {
    ...sub,
    _id: sub._id || sub.id || `sub_${Date.now()}`,
    customer: customerObj,
    product: productObj,
    plan: planObj,
    quotation: quotationObj,
    quantity,
    startDate: sub.startDate || sub.createdAt || new Date().toISOString(),
    nextBillingDate: sub.nextBillingDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    // Convenience properties for tables / dashboard
    customerName,
    customerEmail,
    productName,
    planName,
    billingCycle,
    amount: planPrice * quantity,
  };
};
