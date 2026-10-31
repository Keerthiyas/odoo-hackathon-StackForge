import { apiClient } from './api';
import { PlanModel } from '../types';
import { INITIAL_PHASE3_PLANS } from './mockData';

const PLANS_KEY = 'brightloop_plans_v3';

function getStoredPlans(): PlanModel[] {
  try {
    const item = localStorage.getItem(PLANS_KEY);
    if (!item) {
      localStorage.setItem(PLANS_KEY, JSON.stringify(INITIAL_PHASE3_PLANS));
      return INITIAL_PHASE3_PLANS;
    }
    return JSON.parse(item) as PlanModel[];
  } catch {
    return INITIAL_PHASE3_PLANS;
  }
}

function setStoredPlans(plans: PlanModel[]): void {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.warn('Could not persist plans:', err);
  }
}

export const planService = {
  async getPlans(params?: { product?: string; search?: string; status?: string }): Promise<PlanModel[]> {
    let list: PlanModel[] = [];
    try {
      const res = await apiClient.get<PlanModel[]>('/plans', { params });
      if (res.data && Array.isArray(res.data)) {
        list = res.data;
      }
    } catch {
      // Backend offline; load local store
      list = getStoredPlans();
    }

    if (params?.product && params.product !== 'all') {
      list = list.filter(p => p.product === params.product);
    }

    if (params?.search) {
      const term = params.search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term)
      );
    }

    if (params?.status && params.status !== 'all') {
      list = list.filter(p => p.status === params.status);
    }

    return list;
  },

  async getPlanById(id: string): Promise<PlanModel> {
    try {
      const res = await apiClient.get<PlanModel>(`/plans/${id}`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const plans = getStoredPlans();
    const plan = plans.find(p => p._id === id);
    if (!plan) throw new Error(`Plan not found: ${id}`);
    return plan;
  },

  async createPlan(data: {
    name: string;
    code: string;
    product: string;
    price: number;
    billingCycle: 'monthly' | 'quarterly' | 'annual';
    allowPause: boolean;
    allowEarlyClose: boolean;
    allowRenewal: boolean;
    features?: string[];
    status?: 'active' | 'inactive';
  }): Promise<PlanModel> {
    try {
      const res = await apiClient.post<PlanModel>('/plans', data);
      if (res.data && res.data._id) return res.data;
    } catch {
      // Offline fallback
    }

    const randomHex = Math.random().toString(16).substring(2, 10) + Date.now().toString(16).padStart(16, '0');
    const newPlan: PlanModel = {
      _id: randomHex.substring(0, 24),
      name: data.name,
      code: data.code.toUpperCase(),
      product: data.product,
      price: Number(data.price),
      billingCycle: data.billingCycle,
      allowPause: data.allowPause,
      allowEarlyClose: data.allowEarlyClose,
      allowRenewal: data.allowRenewal,
      features: data.features || ['Unlimited access', 'Standard API quotas', 'Email support'],
      status: data.status || 'active',
    };

    const plans = getStoredPlans();
    const updated = [newPlan, ...plans];
    setStoredPlans(updated);
    return newPlan;
  },

  async updatePlan(id: string, data: Partial<PlanModel>): Promise<PlanModel> {
    try {
      const res = await apiClient.put<PlanModel>(`/plans/${id}`, data);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const plans = getStoredPlans();
    const index = plans.findIndex(p => p._id === id);
    if (index === -1) throw new Error('Plan not found');

    const updated = { ...plans[index], ...data };
    plans[index] = updated;
    setStoredPlans(plans);
    return updated;
  },

  async deletePlan(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/plans/${id}`);
      return true;
    } catch {
      // Offline fallback
    }

    const plans = getStoredPlans();
    const filtered = plans.filter(p => p._id !== id);
    setStoredPlans(filtered);
    return true;
  },
};
