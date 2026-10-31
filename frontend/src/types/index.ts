export type UserRole = 
  | 'super_admin' 
  | 'finance_manager' 
  | 'csm' 
  | 'sales_rep' 
  | 'auditor';

export type SubscriptionStatus = 
  | 'active' 
  | 'past_due' 
  | 'trialing' 
  | 'paused' 
  | 'canceled';

export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export type HealthScore = 'healthy' | 'neutral' | 'at_risk';

export type InvoiceStatus = 'paid' | 'open' | 'overdue' | 'void' | 'draft';

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxSeats: number;
  maxApiCalls: number;
  supportTier: string;
  features: string[];
  isPopular?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  avatar: string;
  tier: string;
  status: 'active' | 'churn_risk' | 'churned' | 'onboarding';
  healthScore: HealthScore;
  healthReason?: string;
  joinedDate: string;
  csmName: string;
  lifetimeValue: number;
  currentMrr: number;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: {
    brand: string;
    last4: string;
    expiry: string;
    type: 'card' | 'ach' | 'sepa';
  };
  lifecycleEvents: Array<{
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'upgrade' | 'downgrade' | 'payment' | 'note' | 'trial' | 'renewal';
  }>;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number;
  seats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  churnReason?: string;
  discountPercent: number;
  paymentMethodSummary: string;
  autoRenew: boolean;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  subscriptionId?: string;
  planName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
}

export interface RevenueMetric {
  mrr: number;
  mrrGrowth: number;
  arr: number;
  activeSubscriptions: number;
  netRevenueRetention: number;
  churnRate: number;
  arpu: number;
  monthlyTrends: Array<{
    month: string;
    mrr: number;
    arr: number;
    newSubscribers: number;
    churnedSubscribers: number;
    expansionMrr: number;
  }>;
  churnReasons: Array<{
    reason: string;
    percentage: number;
    count: number;
  }>;
}

export interface ActivityNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
}

// ==================== PHASE 3 MONGOOSE SCHEMAS ====================

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface Product {
  _id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
  basePrice?: number;
}

export interface PlanModel {
  _id: string;
  name: string;
  code: string;
  product: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  allowPause: boolean;
  allowEarlyClose: boolean;
  allowRenewal: boolean;
  features?: string[];
  status: 'active' | 'inactive';
}

export interface UserModel {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'staff';
  company?: string;
  phone?: string;
}

/**
 * Exact Quotation Schema (MongoDB/Mongoose):
 * - customer: ObjectId referencing User (Required)
 * - product: ObjectId referencing Product (Required)
 * - plan: ObjectId referencing Plan (Required)
 * - quantity: Number (Required, minimum 1)
 * - unitPrice: Number (Required)
 * - totalAmount: Number (Stored snapshot)
 * - status: String (draft | sent | accepted | rejected)
 * - validUntil: Date (Optional)
 * - createdBy: ObjectId referencing User (Staff/Admin)
 */
export interface Quotation {
  _id: string;
  quotationNumber?: string;
  customer: string;
  product: string;
  plan: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: QuotationStatus;
  validUntil?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PopulatedQuotation extends Omit<Quotation, 'customer' | 'product' | 'plan' | 'createdBy'> {
  customer: UserModel;
  product: Product;
  plan: PlanModel;
  createdBy: UserModel;
}

/**
 * Exact Subscription Schema (MongoDB/Mongoose):
 * - customer: ObjectId referencing User (Required)
 * - product: ObjectId referencing Product (Required)
 * - plan: ObjectId referencing Plan (Required)
 * - quotation: ObjectId referencing Quotation (Source quotation)
 * - quantity: Number (Required)
 * - startDate: Date (Required)
 * - nextBillingDate: Date (Required)
 * - status: String (active | paused | closed)
 */
export type Phase3SubscriptionStatus = 'active' | 'paused' | 'closed';

export interface Phase3Subscription {
  _id: string;
  customer: string;
  product: string;
  plan: string;
  quotation: string;
  quantity: number;
  startDate: string;
  nextBillingDate: string;
  status: Phase3SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PopulatedSubscription extends Omit<Phase3Subscription, 'customer' | 'product' | 'plan' | 'quotation'> {
  customer: UserModel;
  product: Product;
  plan: PlanModel;
  quotation: PopulatedQuotation | Quotation;
}

// ==================== PHASE 4 MONGOOSE SCHEMAS ====================

/**
 * Exact Invoice Schema (MongoDB/Mongoose):
 * - customer: ObjectId referencing User
 * - subscription: ObjectId referencing Subscription
 * - amount: Number
 * - dueDate: Date
 * - status: String (draft | sent | paid | overdue)
 * - generatedAt: Date
 */
export type Phase4InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Phase4Invoice {
  _id: string;
  customer: string; // ObjectId referencing User
  subscription: string; // ObjectId referencing Subscription
  amount: number;
  dueDate: string;
  status: Phase4InvoiceStatus;
  generatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PopulatedPhase4Invoice extends Omit<Phase4Invoice, 'customer' | 'subscription'> {
  customer: UserModel;
  subscription: PopulatedSubscription | Phase3Subscription;
}

/**
 * Exact Payment Schema (MongoDB/Mongoose):
 * - invoice: ObjectId referencing Invoice
 * - customer: ObjectId referencing User
 * - amount: Number
 * - paymentMethod: String (bank_transfer | card | cash | other)
 * - paymentDate: Date
 * - status: String (completed | pending)
 */
export type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'other';
export type PaymentStatus = 'completed' | 'pending';

export interface PaymentModel {
  _id: string;
  invoice: string; // ObjectId referencing Invoice
  customer: string; // ObjectId referencing User
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PopulatedPaymentModel extends Omit<PaymentModel, 'invoice' | 'customer'> {
  invoice: PopulatedPhase4Invoice | Phase4Invoice;
  customer: UserModel;
}
