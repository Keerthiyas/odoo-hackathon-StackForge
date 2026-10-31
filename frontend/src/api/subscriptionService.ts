/**
 * Subscription API Service
 * Centralizes HTTP requests for Subscription Management
 * Follows exact Mongoose Subscription schema:
 * { customer, product, plan, quotation, quantity, startDate, nextBillingDate, status }
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { CreateSubscriptionDTO, Subscription, SubscriptionStatus, UpdateSubscriptionDTO } from '../types';
import {
  getStoredSubscriptions,
  saveStoredSubscriptions,
  populateSubscription,
} from '../data/quotationSubscriptionMockData';

export interface SubscriptionQueryParams {
  search?: string;
  status?: SubscriptionStatus | 'all';
  productId?: string | 'all';
  planId?: string | 'all';
  billingTimeline?: 'all' | '7days' | '30days';
  page?: number;
  limit?: number;
}

export interface PaginatedSubscriptionsResponse {
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const subscriptionService = {
  /**
   * Fetch all subscriptions with search, status filter, product filter, plan filter, timeline filter, and pagination
   */
  async getSubscriptions(params?: SubscriptionQueryParams): Promise<PaginatedSubscriptionsResponse> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.BASE, { params });
      if (Array.isArray(response.data)) {
        return {
          data: response.data.map(populateSubscription),
          total: response.data.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: Math.ceil(response.data.length / (params?.limit || 10)),
        };
      }
      return {
        ...response.data,
        data: response.data.data.map(populateSubscription),
      };
    } catch {
      let subs = getStoredSubscriptions().map(populateSubscription);

      // Search by subscription ID, customer name, product name or plan name
      if (params?.search && params.search.trim()) {
        const query = params.search.trim().toLowerCase();
        subs = subs.filter((s) => {
          const idMatch = (s.subscriptionNumber || s._id || '').toLowerCase().includes(query);
          const custName =
            typeof s.customer === 'object' && s.customer !== null && 'name' in s.customer
              ? (s.customer as any).name
              : s.customerName || '';
          const prodName =
            typeof s.product === 'object' && s.product !== null && 'name' in s.product
              ? (s.product as any).name
              : s.productName || '';
          const planName =
            typeof s.plan === 'object' && s.plan !== null && 'name' in s.plan
              ? (s.plan as any).name
              : s.planName || '';
          return (
            idMatch ||
            custName.toLowerCase().includes(query) ||
            prodName.toLowerCase().includes(query) ||
            planName.toLowerCase().includes(query)
          );
        });
      }

      // Filter by status (active | paused | closed)
      if (params?.status && params.status !== 'all') {
        const target = params.status.toLowerCase();
        subs = subs.filter((s) => (s.status ? s.status.toLowerCase() === target : false));
      }

      // Filter by product ObjectId
      if (params?.productId && params.productId !== 'all') {
        subs = subs.filter((s) => {
          const prodId = typeof s.product === 'object' && s.product !== null ? (s.product as any)._id : s.product;
          return prodId === params.productId;
        });
      }

      // Filter by plan ObjectId
      if (params?.planId && params.planId !== 'all') {
        subs = subs.filter((s) => {
          const plId = typeof s.plan === 'object' && s.plan !== null ? (s.plan as any)._id : s.plan;
          return plId === params.planId;
        });
      }

      // Filter by next billing date timeline
      if (params?.billingTimeline && params.billingTimeline !== 'all') {
        const now = new Date();
        subs = subs.filter((s) => {
          if (!s.nextBillingDate) return true;
          const billingDate = new Date(s.nextBillingDate);
          const diffDays = (billingDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (params.billingTimeline === '7days') {
            return diffDays >= 0 && diffDays <= 7;
          }
          if (params.billingTimeline === '30days') {
            return diffDays >= 0 && diffDays <= 30;
          }
          return true;
        });
      }

      const total = subs.length;
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const paginated = subs.slice(startIndex, startIndex + limit);

      return {
        data: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  },

  /**
   * Get single subscription by ID
   */
  async getSubscriptionById(id: string): Promise<Subscription> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id));
      return populateSubscription(response.data);
    } catch {
      const stored = getStoredSubscriptions();
      const match = stored.find((s) => s._id === id || s.id === id);
      if (!match) {
        throw new Error(`Subscription not found with ID ${id}`);
      }
      return populateSubscription(match);
    }
  },

  /**
   * Create new subscription converted from an accepted quotation
   * Fields: customer, product, plan, quotation, quantity, startDate, nextBillingDate, status: 'active'
   */
  async createSubscription(dto: CreateSubscriptionDTO): Promise<Subscription> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.BASE, dto);
      return populateSubscription(response.data);
    } catch {
      const subscriptions = getStoredSubscriptions();
      const count = subscriptions.length + 1;
      const subNum = `SUB-2026-${String(count).padStart(3, '0')}`;
      const newId = `6620f4d4e4b0a1a2b3c4a${Date.now().toString().slice(-3)}`;

      const newSub: Subscription = {
        _id: newId,
        subscriptionNumber: subNum,
        customer: dto.customer,
        product: dto.product,
        plan: dto.plan,
        quotation: dto.quotation,
        quantity: Math.max(1, Number(dto.quantity) || 1),
        startDate: dto.startDate || new Date().toISOString(),
        nextBillingDate: dto.nextBillingDate,
        status: (dto.status as SubscriptionStatus) || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newSub, ...subscriptions];
      saveStoredSubscriptions(updated);
      return populateSubscription(newSub);
    }
  },

  /**
   * Update subscription details or status
   */
  async updateSubscription(id: string, dto: UpdateSubscriptionDTO): Promise<Subscription> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id), dto);
      return populateSubscription(response.data);
    } catch {
      const subscriptions = getStoredSubscriptions();
      const index = subscriptions.findIndex((s) => s._id === id || s.id === id);
      if (index === -1) {
        throw new Error(`Subscription with ID ${id} not found.`);
      }

      const existing = subscriptions[index];
      const updatedSub: Subscription = {
        ...existing,
        status: dto.status !== undefined ? dto.status : existing.status,
        nextBillingDate: dto.nextBillingDate !== undefined ? dto.nextBillingDate : existing.nextBillingDate,
        startDate: dto.startDate !== undefined ? dto.startDate : existing.startDate,
        quantity: dto.quantity !== undefined ? dto.quantity : existing.quantity,
        updatedAt: new Date().toISOString(),
      };

      subscriptions[index] = updatedSub;
      saveStoredSubscriptions(subscriptions);
      return populateSubscription(updatedSub);
    }
  },

  /**
   * Pause a subscription
   * Validates against plan's allowPause policy
   */
  async pauseSubscription(id: string): Promise<Subscription> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.PAUSE(id));
      return populateSubscription(response.data);
    } catch {
      const sub = await this.getSubscriptionById(id);
      const planObj = typeof sub.plan === 'object' && sub.plan !== null ? (sub.plan as any) : null;
      if (planObj && planObj.allowPause === false) {
        throw new Error('This plan does not permit pausing subscriptions.');
      }
      return this.updateSubscription(id, { status: 'paused' });
    }
  },

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(id: string): Promise<Subscription> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.RESUME(id));
      return populateSubscription(response.data);
    } catch {
      return this.updateSubscription(id, { status: 'active' });
    }
  },

  /**
   * Close a subscription permanently
   */
  async closeSubscription(id: string): Promise<Subscription> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CLOSE(id));
      return populateSubscription(response.data);
    } catch {
      return this.updateSubscription(id, { status: 'closed' });
    }
  },
};
