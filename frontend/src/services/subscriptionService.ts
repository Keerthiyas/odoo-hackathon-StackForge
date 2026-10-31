import { apiClient } from './api';
import { 
  Phase3Subscription, 
  PopulatedSubscription, 
  Phase3SubscriptionStatus, 
  Quotation, 
  PopulatedQuotation,
  Product, 
  PlanModel, 
  UserModel 
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_PHASE3_PLANS, 
  INITIAL_USERS, 
  INITIAL_QUOTATIONS, 
  INITIAL_PHASE3_SUBSCRIPTIONS 
} from './mockData';
import { quotationService } from './quotationService';

const STORAGE_KEY = 'brightloop_subscriptions_phase3';

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
    console.warn('Could not persist to storage:', err);
  }
}

export const subscriptionService = {
  // Populate reference ObjectIds for rich presentation
  async populateSubscription(sub: Phase3Subscription): Promise<PopulatedSubscription> {
    const [products, plans, users, quotationsRes] = await Promise.all([
      quotationService.getProducts(),
      quotationService.getPlans(),
      quotationService.getUsers(),
      quotationService.listQuotations(),
    ]);

    const customer = users.find(u => u._id === sub.customer) || {
      _id: sub.customer,
      name: 'Corporate Client',
      email: 'client@enterprise.com',
      role: 'customer' as const,
      company: 'Enterprise Org',
    };

    const product = products.find(p => p._id === sub.product) || {
      _id: sub.product,
      name: 'Brightloop Platform Service',
      code: 'PROD-CORE',
      description: '',
      status: 'active' as const,
    };

    const plan = plans.find(p => p._id === sub.plan) || {
      _id: sub.plan,
      name: 'Enterprise Tier',
      code: 'PLAN-ENT',
      product: sub.product,
      price: 499,
      billingCycle: 'monthly' as const,
      allowPause: true,
      allowEarlyClose: true,
      allowRenewal: true,
      status: 'active' as const,
    };

    const quotation = quotationsRes.quotations.find(q => q._id === sub.quotation) || {
      _id: sub.quotation,
      quotationNumber: 'QT-SOURCE',
      customer: sub.customer,
      product: sub.product,
      plan: sub.plan,
      quantity: sub.quantity,
      unitPrice: plan.price,
      totalAmount: plan.price * sub.quantity,
      status: 'accepted' as const,
      createdBy: 'system',
    };

    return {
      ...sub,
      customer,
      product,
      plan,
      quotation,
    };
  },

  // Retrieve eligible accepted quotations for subscription conversion
  async getEligibleQuotations(): Promise<PopulatedQuotation[]> {
    const listRes = await quotationService.listQuotations({ status: 'accepted' });
    return listRes.quotations;
  },

  // List Subscriptions with filters and pagination
  async listSubscriptions(params?: {
    search?: string;
    status?: string;
    productId?: string;
    planId?: string;
    nextBillingBefore?: string;
    page?: number;
    limit?: number;
  }): Promise<{ subscriptions: PopulatedSubscription[]; total: number; page: number; totalPages: number }> {
    let rawList: Phase3Subscription[] = [];

    try {
      const res = await apiClient.get<Phase3Subscription[]>('/subscriptions', { params });
      if (res.data && Array.isArray(res.data)) {
        rawList = res.data;
      }
    } catch {
      // Backend unavailable; use local mock store
      rawList = getStored<Phase3Subscription[]>(STORAGE_KEY, INITIAL_PHASE3_SUBSCRIPTIONS);
    }

    let populated = await Promise.all(rawList.map(s => this.populateSubscription(s)));

    // Client filtering when backend is offline
    if (params?.search) {
      const term = params.search.toLowerCase();
      populated = populated.filter(s =>
        s._id.toLowerCase().includes(term) ||
        s.customer.name.toLowerCase().includes(term) ||
        (s.customer.company && s.customer.company.toLowerCase().includes(term)) ||
        s.product.name.toLowerCase().includes(term) ||
        s.plan.name.toLowerCase().includes(term)
      );
    }

    if (params?.status && params.status !== 'all') {
      populated = populated.filter(s => s.status === params.status);
    }

    if (params?.productId && params.productId !== 'all') {
      populated = populated.filter(s => s.product._id === params.productId);
    }

    if (params?.planId && params.planId !== 'all') {
      populated = populated.filter(s => s.plan._id === params.planId);
    }

    if (params?.nextBillingBefore) {
      populated = populated.filter(s => s.nextBillingDate <= params.nextBillingBefore!);
    }

    const total = populated.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = populated.slice(startIndex, startIndex + limit);

    return {
      subscriptions: paginated,
      total,
      page,
      totalPages,
    };
  },

  async getSubscriptionById(id: string): Promise<PopulatedSubscription> {
    let raw: Phase3Subscription | undefined;

    try {
      const res = await apiClient.get<Phase3Subscription>(`/subscriptions/${id}`);
      if (res.data) raw = res.data;
    } catch {
      const stored = getStored<Phase3Subscription[]>(STORAGE_KEY, INITIAL_PHASE3_SUBSCRIPTIONS);
      raw = stored.find(s => s._id === id);
    }

    if (!raw) {
      throw new Error(`Subscription not found: ${id}`);
    }

    return this.populateSubscription(raw);
  },

  /**
   * Create Subscription from accepted quotation
   * Follows exact Subscription schema:
   * - customer: ObjectId
   * - product: ObjectId
   * - plan: ObjectId
   * - quotation: ObjectId
   * - quantity: Number
   * - startDate: Date
   * - nextBillingDate: Date
   * - status: 'active' | 'paused' | 'closed'
   */
  async createSubscription(data: {
    customer: string;
    product: string;
    plan: string;
    quotation: string;
    quantity: number;
    startDate: string;
    nextBillingDate: string;
    status?: Phase3SubscriptionStatus;
  }): Promise<Phase3Subscription> {
    const payload: Omit<Phase3Subscription, '_id'> = {
      customer: data.customer,
      product: data.product,
      plan: data.plan,
      quotation: data.quotation,
      quantity: Number(data.quantity),
      startDate: data.startDate,
      nextBillingDate: data.nextBillingDate,
      status: data.status || 'active',
    };

    try {
      const res = await apiClient.post<Phase3Subscription>('/subscriptions', payload);
      if (res.data && res.data._id) return res.data;
    } catch {
      // Offline fallback
    }

    // Generate random 24-char ObjectId
    const randomHex = Math.random().toString(16).substring(2, 10) + Date.now().toString(16).padStart(16, '0');
    const newSub: Phase3Subscription = {
      ...payload,
      _id: randomHex.substring(0, 24),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const stored = getStored<Phase3Subscription[]>(STORAGE_KEY, INITIAL_PHASE3_SUBSCRIPTIONS);
    const updated = [newSub, ...stored];
    setStored(STORAGE_KEY, updated);

    return newSub;
  },

  /**
   * Pause Subscription
   * Respects allowPause field on plan!
   */
  async pauseSubscription(id: string): Promise<Phase3Subscription> {
    try {
      const res = await apiClient.post<Phase3Subscription>(`/subscriptions/${id}/pause`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const stored = getStored<Phase3Subscription[]>(STORAGE_KEY, INITIAL_PHASE3_SUBSCRIPTIONS);
    const index = stored.findIndex(s => s._id === id);
    if (index === -1) throw new Error('Subscription not found');

    const sub = stored[index];
    const plans = await quotationService.getPlans();
    const plan = plans.find(p => p._id === sub.plan);
    if (plan && !plan.allowPause) {
      throw new Error(`Plan "${plan.name}" does not permit subscription pausing.`);
    }

    const updated: Phase3Subscription = {
      ...sub,
      status: 'paused',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    stored[index] = updated;
    setStored(STORAGE_KEY, stored);
    return updated;
  },

  /**
   * Resume Subscription
   */
  async resumeSubscription(id: string): Promise<Phase3Subscription> {
    try {
      const res = await apiClient.post<Phase3Subscription>(`/subscriptions/${id}/resume`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const stored = getStored<Phase3Subscription[]>(STORAGE_KEY, INITIAL_PHASE3_SUBSCRIPTIONS);
    const index = stored.findIndex(s => s._id === id);
    if (index === -1) throw new Error('Subscription not found');

    const sub = stored[index];
    if (sub.status !== 'paused') {
      throw new Error('Only paused subscriptions can be resumed.');
    }

    const updated: Phase3Subscription = {
      ...sub,
      status: 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    stored[index] = updated;
    setStored(STORAGE_KEY, stored);
    return updated;
  },

  /**
   * Close Subscription
   * Respects allowEarlyClose field on plan!
   */
  async closeSubscription(id: string): Promise<Phase3Subscription> {
    try {
      const res = await apiClient.post<Phase3Subscription>(`/subscriptions/${id}/close`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const stored = getStored<Phase3Subscription[]>(STORAGE_KEY, INITIAL_PHASE3_SUBSCRIPTIONS);
    const index = stored.findIndex(s => s._id === id);
    if (index === -1) throw new Error('Subscription not found');

    const sub = stored[index];
    const plans = await quotationService.getPlans();
    const plan = plans.find(p => p._id === sub.plan);
    if (plan && !plan.allowEarlyClose) {
      throw new Error(`Plan "${plan.name}" does not permit early closure.`);
    }

    const updated: Phase3Subscription = {
      ...sub,
      status: 'closed',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    stored[index] = updated;
    setStored(STORAGE_KEY, stored);
    return updated;
  },
};
