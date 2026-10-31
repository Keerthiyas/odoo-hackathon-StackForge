import axios, { AxiosInstance } from 'axios';
import { 
  Customer, 
  Invoice, 
  Plan, 
  RevenueMetric, 
  Subscription, 
  SubscriptionStatus, 
  HealthScore 
} from '../types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_INVOICES, 
  INITIAL_METRICS, 
  INITIAL_PLANS, 
  INITIAL_SUBSCRIPTIONS 
} from './mockData';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api';
const API_TIMEOUT = Number(typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_TIMEOUT) || 15000;

const STORAGE_KEYS = {
  CUSTOMERS: 'brightloop_customers_v1',
  SUBSCRIPTIONS: 'brightloop_subscriptions_v1',
  INVOICES: 'brightloop_invoices_v1',
  PLANS: 'brightloop_plans_v1',
  METRICS: 'brightloop_metrics_v1',
};

// Client Axios instance adhering to .env configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-App': (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_NAME) || 'Brightloop Software',
  },
});

// Helper for local persistent fallback store
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not persist to localStorage:', err);
  }
}

export class BrightloopService {
  private static isBackendAvailable: boolean | null = null;

  // Initialize and check status
  static async checkBackendHealth(): Promise<{ online: boolean; url: string }> {
    try {
      const res = await apiClient.get('/health', { timeout: 2000 });
      this.isBackendAvailable = res.status === 200;
      return { online: true, url: API_BASE_URL };
    } catch {
      this.isBackendAvailable = false;
      return { online: false, url: API_BASE_URL };
    }
  }

  // Plans
  static async getPlans(): Promise<Plan[]> {
    if (this.isBackendAvailable) {
      try {
        const res = await apiClient.get<Plan[]>('/plans');
        return res.data;
      } catch {
        // Fall back to local store
      }
    }
    return getStored<Plan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  }

  static async updatePlan(planId: string, updates: Partial<Plan>): Promise<Plan> {
    const plans = await this.getPlans();
    const index = plans.findIndex(p => p.id === planId);
    if (index === -1) throw new Error('Plan not found');
    const updated = { ...plans[index], ...updates };
    plans[index] = updated;
    setStored(STORAGE_KEYS.PLANS, plans);
    return updated;
  }

  // Subscriptions
  static async getSubscriptions(): Promise<Subscription[]> {
    if (this.isBackendAvailable) {
      try {
        const res = await apiClient.get<Subscription[]>('/subscriptions');
        return res.data;
      } catch {
        // fallback
      }
    }
    return getStored<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
  }

  static async createSubscription(data: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
    const newSub: Subscription = {
      ...data,
      id: `sub_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const subs = await this.getSubscriptions();
    const updated = [newSub, ...subs];
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, updated);

    // Also update customer tier & MRR
    const customers = await this.getCustomers();
    const customer = customers.find(c => c.id === data.customerId);
    if (customer) {
      customer.tier = data.planName;
      customer.currentMrr = data.billingCycle === 'annual' ? Math.round(data.amount / 12) : data.amount;
      customer.lifecycleEvents.unshift({
        id: `ev_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Subscribed to ${data.planName}`,
        description: `Billed $${data.amount} (${data.billingCycle}) with ${data.seats} seats.`,
        type: 'upgrade',
      });
      setStored(STORAGE_KEYS.CUSTOMERS, customers);
    }

    // Auto-create initial invoice
    await this.createInvoice({
      customerId: data.customerId,
      customerName: data.customerName,
      customerCompany: data.customerCompany,
      customerEmail: data.customerEmail,
      subscriptionId: newSub.id,
      planName: data.planName,
      subtotal: data.amount,
      discount: (data.amount * data.discountPercent) / 100,
      tax: Math.round(data.amount * 0.08 * 100) / 100,
      total: Math.round((data.amount - (data.amount * data.discountPercent) / 100 + data.amount * 0.08) * 100) / 100,
      status: 'paid',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      paidAt: new Date().toISOString().split('T')[0],
      notes: `Generated on subscription start. Paid via ${data.paymentMethodSummary}`,
      lineItems: [
        {
          id: `li_${Date.now()}`,
          description: `${data.planName} Subscription (${data.billingCycle}) - ${data.seats} seats`,
          quantity: 1,
          unitPrice: data.amount,
          amount: data.amount,
        },
      ],
    });

    return newSub;
  }

  static async updateSubscriptionStatus(
    subscriptionId: string, 
    status: SubscriptionStatus, 
    churnReason?: string
  ): Promise<Subscription> {
    const subs = await this.getSubscriptions();
    const index = subs.findIndex(s => s.id === subscriptionId);
    if (index === -1) throw new Error('Subscription not found');

    const sub = subs[index];
    sub.status = status;
    if (status === 'canceled') {
      sub.cancelAtPeriodEnd = true;
      sub.canceledAt = new Date().toISOString().split('T')[0];
      if (churnReason) sub.churnReason = churnReason;
    } else if (status === 'active') {
      sub.cancelAtPeriodEnd = false;
      sub.canceledAt = undefined;
    }

    subs[index] = sub;
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    // Update customer status
    const customers = await this.getCustomers();
    const cust = customers.find(c => c.id === sub.customerId);
    if (cust) {
      if (status === 'canceled') {
        cust.status = 'churned';
        cust.healthScore = 'at_risk';
        cust.currentMrr = 0;
      } else if (status === 'active') {
        cust.status = 'active';
        cust.healthScore = 'healthy';
      }
      cust.lifecycleEvents.unshift({
        id: `ev_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Subscription status updated: ${status.toUpperCase()}`,
        description: churnReason ? `Reason: ${churnReason}` : `Status adjusted by admin.`,
        type: status === 'canceled' ? 'downgrade' : 'upgrade',
      });
      setStored(STORAGE_KEYS.CUSTOMERS, customers);
    }

    return sub;
  }

  // Customers
  static async getCustomers(): Promise<Customer[]> {
    if (this.isBackendAvailable) {
      try {
        const res = await apiClient.get<Customer[]>('/customers');
        return res.data;
      } catch {
        // fallback
      }
    }
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static async addCustomerNote(customerId: string, noteTitle: string, noteContent: string): Promise<Customer> {
    const customers = await this.getCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (!cust) throw new Error('Customer not found');

    cust.lifecycleEvents.unshift({
      id: `ev_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: noteTitle,
      description: noteContent,
      type: 'note',
    });

    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    return cust;
  }

  static async updateCustomerHealth(
    customerId: string, 
    healthScore: HealthScore, 
    reason: string
  ): Promise<Customer> {
    const customers = await this.getCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (!cust) throw new Error('Customer not found');

    cust.healthScore = healthScore;
    cust.healthReason = reason;
    cust.lifecycleEvents.unshift({
      id: `ev_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: `Health Score Updated: ${healthScore.toUpperCase()}`,
      description: reason,
      type: 'note',
    });

    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    return cust;
  }

  // Invoices
  static async getInvoices(): Promise<Invoice[]> {
    if (this.isBackendAvailable) {
      try {
        const res = await apiClient.get<Invoice[]>('/invoices');
        return res.data;
      } catch {
        // fallback
      }
    }
    return getStored<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }

  static async createInvoice(data: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<Invoice> {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const newInvoice: Invoice = {
      ...data,
      id: `inv_${Date.now().toString(36)}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${randomSeq}`,
    };

    const invoices = await this.getInvoices();
    const updated = [newInvoice, ...invoices];
    setStored(STORAGE_KEYS.INVOICES, updated);
    return newInvoice;
  }

  static async markInvoicePaid(invoiceId: string): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex(i => i.id === invoiceId);
    if (index === -1) throw new Error('Invoice not found');

    const inv = invoices[index];
    inv.status = 'paid';
    inv.paidAt = new Date().toISOString().split('T')[0];
    inv.notes = (inv.notes ? inv.notes + ' ' : '') + `Marked as paid manually on ${inv.paidAt}.`;
    invoices[index] = inv;
    setStored(STORAGE_KEYS.INVOICES, invoices);

    // If subscription linked was past due, update to active
    if (inv.subscriptionId) {
      try {
        await this.updateSubscriptionStatus(inv.subscriptionId, 'active');
      } catch {
        // ignore
      }
    }

    return inv;
  }

  static async refundInvoice(invoiceId: string, reason: string): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex(i => i.id === invoiceId);
    if (index === -1) throw new Error('Invoice not found');

    const inv = invoices[index];
    inv.status = 'void';
    inv.notes = (inv.notes ? inv.notes + ' | ' : '') + `Refunded/Voided: ${reason}`;
    invoices[index] = inv;
    setStored(STORAGE_KEYS.INVOICES, invoices);
    return inv;
  }

  // Metrics
  static async getMetrics(): Promise<RevenueMetric> {
    return getStored<RevenueMetric>(STORAGE_KEYS.METRICS, INITIAL_METRICS);
  }

  // Simulate Webhook Event from Stripe or Payment Gateway
  static async simulateWebhook(
    eventType: 'payment_succeeded' | 'payment_failed' | 'subscription_canceled' | 'trial_ended',
    subscriptionId?: string
  ): Promise<{ success: boolean; event: string; message: string }> {
    const subs = await this.getSubscriptions();
    const sub = subscriptionId 
      ? subs.find(s => s.id === subscriptionId) 
      : subs[0];

    if (!sub) {
      return { success: false, event: eventType, message: 'No target subscription found.' };
    }

    if (eventType === 'payment_succeeded') {
      await this.updateSubscriptionStatus(sub.id, 'active');
      await this.createInvoice({
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerCompany: sub.customerCompany,
        customerEmail: sub.customerEmail,
        subscriptionId: sub.id,
        planName: sub.planName,
        subtotal: sub.amount,
        discount: 0,
        tax: Math.round(sub.amount * 0.08 * 100) / 100,
        total: Math.round(sub.amount * 1.08 * 100) / 100,
        status: 'paid',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        paidAt: new Date().toISOString().split('T')[0],
        notes: `Simulated webhook event: invoice.payment_succeeded for ${sub.customerCompany}.`,
        lineItems: [
          {
            id: `li_${Date.now()}`,
            description: `Automated recurring payment for ${sub.planName}`,
            quantity: 1,
            unitPrice: sub.amount,
            amount: sub.amount,
          },
        ],
      });
      return {
        success: true,
        event: 'invoice.payment_succeeded',
        message: `Payment of $${sub.amount} succeeded for ${sub.customerCompany}. Subscription set to ACTIVE.`,
      };
    }

    if (eventType === 'payment_failed') {
      await this.updateSubscriptionStatus(sub.id, 'past_due');
      return {
        success: true,
        event: 'invoice.payment_failed',
        message: `Payment of $${sub.amount} failed for ${sub.customerCompany}. Subscription marked as PAST DUE with automated dunning.`,
      };
    }

    if (eventType === 'subscription_canceled') {
      await this.updateSubscriptionStatus(sub.id, 'canceled', 'Canceled via Stripe customer portal webhook');
      return {
        success: true,
        event: 'customer.subscription.deleted',
        message: `Subscription for ${sub.customerCompany} was deleted via gateway webhook.`,
      };
    }

    if (eventType === 'trial_ended') {
      await this.updateSubscriptionStatus(sub.id, 'active');
      return {
        success: true,
        event: 'customer.subscription.trial_will_end',
        message: `Trial ended for ${sub.customerCompany}. Converted to paid active subscription.`,
      };
    }

    return { success: false, event: eventType, message: 'Unknown event type' };
  }

  // Restore factory seed data
  static resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(INITIAL_METRICS));
  }
}
