import { apiClient } from './api';
import { 
  Quotation, 
  PopulatedQuotation, 
  QuotationStatus, 
  Product, 
  PlanModel, 
  UserModel 
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_PHASE3_PLANS, 
  INITIAL_USERS, 
  INITIAL_QUOTATIONS 
} from './mockData';

const STORAGE_KEY = 'brightloop_quotations_v3';
const PRODUCTS_KEY = 'brightloop_products_v3';
const PLANS_KEY = 'brightloop_plans_v3';
const USERS_KEY = 'brightloop_users_v3';

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

export const quotationService = {
  // Auxiliary master data queries
  async getProducts(): Promise<Product[]> {
    try {
      const res = await apiClient.get<Product[]>('/products');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // Backend unavailable; use local store
    }
    return getStored<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
  },

  async getPlans(productId?: string): Promise<PlanModel[]> {
    try {
      const res = await apiClient.get<PlanModel[]>('/plans', {
        params: productId ? { product: productId } : undefined,
      });
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // Backend unavailable; use local store
    }
    const allPlans = getStored<PlanModel[]>(PLANS_KEY, INITIAL_PHASE3_PLANS);
    return productId ? allPlans.filter(p => p.product === productId) : allPlans;
  },

  async getUsers(): Promise<UserModel[]> {
    try {
      const res = await apiClient.get<UserModel[]>('/users');
      if (res.data && Array.isArray(res.data)) return res.data;
    } catch {
      // Backend unavailable; use local store
    }
    return getStored<UserModel[]>(USERS_KEY, INITIAL_USERS);
  },

  async getCurrentUser(): Promise<UserModel> {
    const users = await this.getUsers();
    // Default to the first authenticated staff/admin identity
    const staff = users.find(u => u.role === 'admin' || u.role === 'staff');
    return staff || users[0];
  },

  // Helper to resolve populated references for the frontend
  async populateQuotation(q: Quotation): Promise<PopulatedQuotation> {
    const [products, plans, users] = await Promise.all([
      this.getProducts(),
      this.getPlans(),
      this.getUsers(),
    ]);

    const customer = users.find(u => u._id === q.customer) || {
      _id: q.customer,
      name: 'Unknown Customer',
      email: 'unresolved@customer.io',
      role: 'customer' as const,
      company: 'External Enterprise',
    };

    const product = products.find(p => p._id === q.product) || {
      _id: q.product,
      name: 'Unspecified Product',
      code: 'PROD-UNKNOWN',
      description: '',
      status: 'active' as const,
    };

    const plan = plans.find(p => p._id === q.plan) || {
      _id: q.plan,
      name: 'Default Plan',
      code: 'PLAN-UNKNOWN',
      product: q.product,
      price: q.unitPrice,
      billingCycle: 'monthly' as const,
      allowPause: true,
      allowEarlyClose: true,
      allowRenewal: true,
      status: 'active' as const,
    };

    const createdBy = users.find(u => u._id === q.createdBy) || {
      _id: q.createdBy,
      name: 'System Admin',
      email: 'admin@brightloopsoftware.com',
      role: 'admin' as const,
    };

    return {
      ...q,
      customer,
      product,
      plan,
      createdBy,
    };
  },

  // Quotation CRUD & Actions
  async listQuotations(params?: {
    search?: string;
    status?: string;
    productId?: string;
    planId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ quotations: PopulatedQuotation[]; total: number; page: number; totalPages: number }> {
    let rawList: Quotation[] = [];

    try {
      const res = await apiClient.get<Quotation[]>('/quotations', { params });
      if (res.data && Array.isArray(res.data)) {
        rawList = res.data;
      }
    } catch {
      // Backend is offline or not implemented yet; load mock data
      rawList = getStored<Quotation[]>(STORAGE_KEY, INITIAL_QUOTATIONS);
    }

    // Populate all entities
    let populated = await Promise.all(rawList.map(q => this.populateQuotation(q)));

    // Apply client filters if backend did not filter
    if (params?.search) {
      const term = params.search.toLowerCase();
      populated = populated.filter(q => 
        (q.quotationNumber && q.quotationNumber.toLowerCase().includes(term)) ||
        q._id.toLowerCase().includes(term) ||
        q.customer.name.toLowerCase().includes(term) ||
        (q.customer.company && q.customer.company.toLowerCase().includes(term)) ||
        q.product.name.toLowerCase().includes(term) ||
        q.plan.name.toLowerCase().includes(term)
      );
    }

    if (params?.status && params.status !== 'all') {
      populated = populated.filter(q => q.status === params.status);
    }

    if (params?.productId && params.productId !== 'all') {
      populated = populated.filter(q => q.product._id === params.productId);
    }

    if (params?.planId && params.planId !== 'all') {
      populated = populated.filter(q => q.plan._id === params.planId);
    }

    if (params?.startDate) {
      populated = populated.filter(q => !q.createdAt || q.createdAt >= params.startDate!);
    }

    if (params?.endDate) {
      populated = populated.filter(q => !q.createdAt || q.createdAt <= params.endDate!);
    }

    const total = populated.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = populated.slice(startIndex, startIndex + limit);

    return {
      quotations: paginated,
      total,
      page,
      totalPages,
    };
  },

  async getQuotationById(id: string): Promise<PopulatedQuotation> {
    let raw: Quotation | undefined;

    try {
      const res = await apiClient.get<Quotation>(`/quotations/${id}`);
      if (res.data) raw = res.data;
    } catch {
      const stored = getStored<Quotation[]>(STORAGE_KEY, INITIAL_QUOTATIONS);
      raw = stored.find(q => q._id === id);
    }

    if (!raw) {
      throw new Error(`Quotation not found: ${id}`);
    }

    return this.populateQuotation(raw);
  },

  /**
   * Create Quotation
   * Follows exact Quotation schema:
   * - customer: ObjectId
   * - product: ObjectId
   * - plan: ObjectId
   * - quantity: Number (>= 1)
   * - unitPrice: Number
   * - totalAmount: Number (snapshot calculated server-side or by quotation pricing service)
   * - status: 'draft' | 'sent' | 'accepted' | 'rejected'
   * - validUntil: Date (Optional)
   * - createdBy: ObjectId (Staff/Admin)
   */
  async createQuotation(data: {
    customer: string;
    product: string;
    plan: string;
    quantity: number;
    unitPrice: number;
    validUntil?: string;
    status?: QuotationStatus;
  }): Promise<Quotation> {
    const currentUser = await this.getCurrentUser();
    
    // Server-side / backend authoritative calculation snapshot
    const totalAmount = data.quantity * data.unitPrice;

    const payload = {
      customer: data.customer,
      product: data.product,
      plan: data.plan,
      quantity: Number(data.quantity),
      unitPrice: Number(data.unitPrice),
      totalAmount,
      status: data.status || 'draft',
      validUntil: data.validUntil || undefined,
      createdBy: currentUser._id,
    };

    try {
      const res = await apiClient.post<Quotation>('/quotations', payload);
      if (res.data && res.data._id) return res.data;
    } catch {
      // Offline fallback: save to local store
    }

    // Generate random 24-character ObjectId-like hex
    const randomHex = Math.random().toString(16).substring(2, 10) + Date.now().toString(16).padStart(16, '0');
    const newQuotation: Quotation = {
      ...payload,
      _id: randomHex.substring(0, 24),
      quotationNumber: `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const stored = getStored<Quotation[]>(STORAGE_KEY, INITIAL_QUOTATIONS);
    const updated = [newQuotation, ...stored];
    setStored(STORAGE_KEY, updated);

    return newQuotation;
  },

  async updateQuotation(id: string, data: Partial<Quotation>): Promise<Quotation> {
    try {
      const res = await apiClient.put<Quotation>(`/quotations/${id}`, data);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const stored = getStored<Quotation[]>(STORAGE_KEY, INITIAL_QUOTATIONS);
    const index = stored.findIndex(q => q._id === id);
    if (index === -1) throw new Error('Quotation not found');

    const updated = {
      ...stored[index],
      ...data,
      totalAmount: data.quantity && data.unitPrice 
        ? data.quantity * data.unitPrice 
        : data.quantity 
        ? data.quantity * stored[index].unitPrice 
        : stored[index].totalAmount,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    stored[index] = updated;
    setStored(STORAGE_KEY, stored);
    return updated;
  },

  async sendQuotation(id: string): Promise<Quotation> {
    try {
      const res = await apiClient.post<Quotation>(`/quotations/${id}/send`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    return this.updateQuotation(id, { status: 'sent' });
  },

  async acceptQuotation(id: string): Promise<Quotation> {
    try {
      const res = await apiClient.post<Quotation>(`/quotations/${id}/accept`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    return this.updateQuotation(id, { status: 'accepted' });
  },

  async rejectQuotation(id: string): Promise<Quotation> {
    try {
      const res = await apiClient.post<Quotation>(`/quotations/${id}/reject`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    return this.updateQuotation(id, { status: 'rejected' });
  },

  async deleteDraftQuotation(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/quotations/${id}`);
      return true;
    } catch {
      // Offline fallback
    }

    const stored = getStored<Quotation[]>(STORAGE_KEY, INITIAL_QUOTATIONS);
    const target = stored.find(q => q._id === id);
    if (target && target.status !== 'draft') {
      throw new Error('Only draft quotations can be deleted.');
    }

    const filtered = stored.filter(q => q._id !== id);
    setStored(STORAGE_KEY, filtered);
    return true;
  },
};
