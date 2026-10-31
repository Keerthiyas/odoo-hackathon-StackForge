/**
 * Plan API Service
 * Centralizes HTTP requests for Plan Management
 * Follows exact Mongoose Plan schema:
 * { product, name, billingCycle, price, allowPause, allowRenewal, allowEarlyClose, isActive }
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { CreatePlanDTO, Plan, PlanBillingCycle, UpdatePlanDTO } from '../types';
import {
  getStoredPlans,
  saveStoredPlans,
  getStoredProducts,
} from '../data/productPlanMockData';

export interface PlanQueryParams {
  search?: string;
  productId?: string | 'all';
  billingCycle?: PlanBillingCycle | 'all';
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
}

export interface PaginatedPlansResponse {
  data: Plan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const planService = {
  /**
   * Fetch all plans with optional search, product filter, cycle filter, status filter, and pagination
   */
  async getPlans(params?: PlanQueryParams): Promise<PaginatedPlansResponse> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PLANS.BASE, { params });
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.data.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: Math.ceil(response.data.length / (params?.limit || 10)),
        };
      }
      return response.data;
    } catch {
      let plans = [...getStoredPlans()];
      const products = getStoredProducts();

      // Search by plan name
      if (params?.search && params.search.trim()) {
        const query = params.search.trim().toLowerCase();
        plans = plans.filter((p) => p.name.toLowerCase().includes(query));
      }

      // Filter by product
      if (params?.productId && params.productId !== 'all') {
        plans = plans.filter((p) => {
          const prodId = typeof p.product === 'string' ? p.product : p.product._id;
          return prodId === params.productId;
        });
      }

      // Filter by billing cycle ('monthly' | 'yearly')
      if (params?.billingCycle && params.billingCycle !== 'all') {
        plans = plans.filter((p) => p.billingCycle === params.billingCycle);
      }

      // Filter by active status
      if (params?.isActive !== undefined && params.isActive !== 'all') {
        const activeBool = params.isActive === true || String(params.isActive) === 'true';
        plans = plans.filter((p) => p.isActive === activeBool);
      }

      // Populate product details if product is string ID for clean UI rendering
      const populatedPlans: Plan[] = plans.map((p) => {
        if (typeof p.product === 'string') {
          const matched = products.find((prod) => prod._id === p.product);
          return {
            ...p,
            product: matched ? { _id: matched._id, name: matched.name } : p.product,
          };
        }
        return p;
      });

      const total = populatedPlans.length;
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const paginatedData = populatedPlans.slice(startIndex, startIndex + limit);

      return {
        data: paginatedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  },

  /**
   * Get single plan by ID
   */
  async getPlanById(id: string): Promise<Plan> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PLANS.BY_ID(id));
      return response.data;
    } catch {
      const plans = getStoredPlans();
      const plan = plans.find((p) => p._id === id);
      if (!plan) {
        throw new Error(`Plan not found with ID ${id}`);
      }
      return plan;
    }
  },

  /**
   * Create a new plan matching Mongoose schema
   */
  async createPlan(dto: CreatePlanDTO): Promise<Plan> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PLANS.BASE, dto);
      return response.data;
    } catch {
      const plans = getStoredPlans();
      const newPlan: Plan = {
        _id: `6620f2b2e4b0a1a2b3c4e${Date.now().toString().slice(-3)}`,
        product: dto.product,
        name: dto.name.trim(),
        billingCycle: dto.billingCycle,
        price: Number(dto.price),
        allowPause: Boolean(dto.allowPause),
        allowRenewal: dto.allowRenewal ?? true,
        allowEarlyClose: Boolean(dto.allowEarlyClose),
        isActive: dto.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newPlan, ...plans];
      saveStoredPlans(updated);
      return newPlan;
    }
  },

  /**
   * Update an existing plan
   */
  async updatePlan(id: string, dto: UpdatePlanDTO): Promise<Plan> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.PLANS.BY_ID(id), dto);
      return response.data;
    } catch {
      const plans = getStoredPlans();
      const index = plans.findIndex((p) => p._id === id);
      if (index === -1) {
        throw new Error(`Plan with ID ${id} not found.`);
      }

      const updatedPlan: Plan = {
        ...plans[index],
        product: dto.product !== undefined ? dto.product : plans[index].product,
        name: dto.name !== undefined ? dto.name.trim() : plans[index].name,
        billingCycle: dto.billingCycle !== undefined ? dto.billingCycle : plans[index].billingCycle,
        price: dto.price !== undefined ? Number(dto.price) : plans[index].price,
        allowPause: dto.allowPause !== undefined ? Boolean(dto.allowPause) : plans[index].allowPause,
        allowRenewal: dto.allowRenewal !== undefined ? Boolean(dto.allowRenewal) : plans[index].allowRenewal,
        allowEarlyClose: dto.allowEarlyClose !== undefined ? Boolean(dto.allowEarlyClose) : plans[index].allowEarlyClose,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : plans[index].isActive,
        updatedAt: new Date().toISOString(),
      };

      plans[index] = updatedPlan;
      saveStoredPlans(plans);
      return updatedPlan;
    }
  },

  /**
   * Delete a plan
   */
  async deletePlan(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.PLANS.BY_ID(id));
      return response.data;
    } catch {
      const plans = getStoredPlans();
      const remaining = plans.filter((p) => p._id !== id);
      saveStoredPlans(remaining);
      return { success: true, message: 'Plan deleted successfully.' };
    }
  },

  /**
   * Toggle plan active/inactive status
   */
  async togglePlanStatus(id: string, isActive: boolean): Promise<Plan> {
    return this.updatePlan(id, { isActive });
  },
};
