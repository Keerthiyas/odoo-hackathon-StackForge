/**
 * MongoDB / Mongoose Database Collection Schemas & Frontend Types
 * Strictly aligned with backend collections: Users, Products, Plans, Subscriptions, Invoices, Payments, Quotations.
 */

export type UserRole = 'admin' | 'staff' | 'customer' | 'ADMIN' | 'STAFF' | 'CUSTOMER';

/**
 * Users Collection Schema
 */
export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  companyName?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Products Collection Schema (Phase 2 Mongoose Schema)
 * Fields: name (req), description (opt), basePrice (req, >= 0), isActive (bool, def true)
 */
export interface Product {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Optional client-side convenience helpers
  plansCount?: number;
  activeSubscriptions?: number;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  basePrice?: number;
  isActive?: boolean;
}

/**
 * Plans Collection Schema (Phase 2 Mongoose Schema)
 * Fields: product (ObjectId req), name (req), billingCycle ('monthly' | 'yearly'),
 * price (req, >= 0), allowPause (bool), allowRenewal (bool), allowEarlyClose (bool), isActive (bool)
 */
export type PlanBillingCycle = 'monthly' | 'yearly';

export interface Plan {
  _id: string;
  product: string | { _id: string; name: string };
  name: string;
  billingCycle: PlanBillingCycle;
  price: number;
  allowPause: boolean;
  allowRenewal: boolean;
  allowEarlyClose: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanDTO {
  product: string;
  name: string;
  billingCycle: PlanBillingCycle;
  price: number;
  allowPause: boolean;
  allowRenewal: boolean;
  allowEarlyClose: boolean;
  isActive: boolean;
}

export interface UpdatePlanDTO {
  product?: string;
  name?: string;
  billingCycle?: PlanBillingCycle;
  price?: number;
  allowPause?: boolean;
  allowRenewal?: boolean;
  allowEarlyClose?: boolean;
  isActive?: boolean;
}

/**
 * Subscriptions Collection Schema (Phase 3 Mongoose Schema)
 * Fields:
 * customer: ObjectId referencing User (Required)
 * product: ObjectId referencing Product (Required)
 * plan: ObjectId referencing Plan (Required)
 * quotation: ObjectId referencing Quotation (Source quotation)
 * quantity: Number (Required)
 * startDate: Date (Required)
 * nextBillingDate: Date (Required)
 * status: String ('active' | 'paused' | 'closed')
 */
export type SubscriptionStatus =
  | 'active'
  | 'paused'
  | 'closed'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID';

export interface Subscription {
  _id?: string;
  id?: string;
  subscriptionNumber?: string;
  customer?: string | User | Customer | { _id: string; id?: string; name: string; email: string; companyName?: string; company?: string };
  product?: string | Product | { _id: string; name: string; basePrice?: number };
  plan?: string | Plan | { _id: string; name: string; price: number; billingCycle: PlanBillingCycle; allowPause?: boolean; allowRenewal?: boolean; allowEarlyClose?: boolean };
  quotation?: string | Quotation | { _id: string; quotationNumber?: string; totalAmount?: number };
  quantity?: number;
  startDate?: string;
  nextBillingDate?: string;
  status: SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;

  // Convenience properties for Dashboard / Legacy compatibility
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  productId?: string;
  productName?: string;
  planId?: string;
  planName?: string;
  billingCycle?: 'monthly' | 'quarterly' | 'annual' | 'yearly';
  amount?: number;
  currency?: string;
  endDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  autoRenew?: boolean;
}

export interface CreateSubscriptionDTO {
  customer: string;
  product: string;
  plan: string;
  quotation: string;
  quantity: number;
  startDate: string;
  nextBillingDate: string;
  status?: 'active' | 'paused' | 'closed';
}

export interface UpdateSubscriptionDTO {
  status?: 'active' | 'paused' | 'closed';
  nextBillingDate?: string;
  startDate?: string;
  quantity?: number;
}

/**
 * Invoices Collection Schema
 */
export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft' | 'void' | 'PAID' | 'PENDING' | 'OVERDUE' | 'DRAFT' | 'VOID';

export interface Invoice {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subscriptionId?: string;
  amount: number;
  tax?: number;
  discount?: number;
  total?: number;
  status: InvoiceStatus;
  issueDate?: string;
  dueDate: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payments Collection Schema
 * Notice status values: 'completed' | 'pending' | 'failed'
 */
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'SUCCESS';

export interface Payment {
  _id?: string;
  id?: string;
  transactionId?: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerId: string;
  customerName?: string;
  amount: number;
  currency?: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'stripe' | 'paypal';
  cardBrand?: string;
  last4?: string;
  status: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
}

/**
 * Customer representation (Users with role: 'customer')
 */
export interface Customer {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  companyName?: string;
  company?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'active' | 'inactive';
  subscriptionsCount?: number;
  totalSpent?: number;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Quotations Collection Schema (Phase 3 Mongoose Schema)
 * Fields:
 * customer: ObjectId referencing User (Required)
 * product: ObjectId referencing Product (Required)
 * plan: ObjectId referencing Plan (Required)
 * quantity: Number (Required, minimum 1)
 * unitPrice: Number (Required)
 * totalAmount: Number (Stored snapshot)
 * status: String ('draft' | 'sent' | 'accepted' | 'rejected')
 * validUntil: Date (Optional)
 * createdBy: ObjectId referencing User (Staff/Admin)
 */
export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'pending'
  | 'expired'
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PENDING'
  | 'EXPIRED';

export interface Quotation {
  _id?: string;
  id?: string;
  quotationNumber?: string;
  customer?: string | User | Customer | { _id: string; id?: string; name: string; email: string; companyName?: string; company?: string };
  product?: string | Product | { _id: string; name: string; basePrice?: number };
  plan?: string | Plan | { _id: string; name: string; price: number; billingCycle: PlanBillingCycle };
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: QuotationStatus;
  validUntil?: string;
  createdBy?: string | User | { _id: string; id?: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;

  // Convenience fields for legacy references
  customerId?: string;
  customerName?: string;
  proposedPlan?: string;
}

export interface CreateQuotationDTO {
  customer: string;
  product: string;
  plan: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'draft' | 'sent';
  validUntil?: string;
  createdBy: string;
}

export interface UpdateQuotationDTO {
  customer?: string;
  product?: string;
  plan?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil?: string;
}

/**
 * Dashboard Metrics aggregating Collections
 */
export interface DashboardMetrics {
  totalCustomers: number;        // From Users collection (role: customer)
  customersGrowth: number;
  totalProducts: number;         // From Products collection
  productsGrowth: number;
  activeSubscriptions: number;   // From Subscriptions collection (status: active)
  activeSubscriptionsGrowth: number;
  totalInvoices: number;         // From Invoices collection
  overdueInvoices: number;       // From Invoices collection (status: overdue)
  overdueCount: number;
  completedPayments: number;     // From Payments collection (status: completed)
  revenueReceived: number;       // From Payments collection (sum of completed amount)
  revenueGrowth: number;
}

export type DateFilterType = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface MonthlyRevenueData {
  month: string;
  mrr: number;
  oneTime: number;
  total: number;
}

export interface SubscriptionGrowthData {
  period: string;
  newSubs: number;
  churned: number;
  netActive: number;
}

export interface PaymentStatusDistribution {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Registration Form Payload matching Users collection
 */
export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  companyName?: string;
}
