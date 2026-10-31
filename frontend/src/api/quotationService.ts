/**
 * Quotation API Service
 * Centralizes HTTP requests for Quotation Management
 * Follows exact Mongoose Quotation schema:
 * { customer, product, plan, quantity, unitPrice, totalAmount, status, validUntil, createdBy }
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { CreateQuotationDTO, Quotation, QuotationStatus, UpdateQuotationDTO } from '../types';
import {
  getStoredQuotations,
  saveStoredQuotations,
  populateQuotation,
} from '../data/quotationSubscriptionMockData';

export interface QuotationQueryParams {
  search?: string;
  status?: QuotationStatus | 'all';
  productId?: string | 'all';
  planId?: string | 'all';
  dateRange?: string | 'all';
  page?: number;
  limit?: number;
}

export interface PaginatedQuotationsResponse {
  data: Quotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const quotationService = {
  /**
   * Fetch all quotations with search, status filter, product filter, plan filter, and pagination
   */
  async getQuotations(params?: QuotationQueryParams): Promise<PaginatedQuotationsResponse> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.QUOTATIONS.BASE, { params });
      if (Array.isArray(response.data)) {
        return {
          data: response.data.map(populateQuotation),
          total: response.data.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: Math.ceil(response.data.length / (params?.limit || 10)),
        };
      }
      return {
        ...response.data,
        data: response.data.data.map(populateQuotation),
      };
    } catch {
      let quotations = getStoredQuotations().map(populateQuotation);

      // Search by quotation number or customer name
      if (params?.search && params.search.trim()) {
        const query = params.search.trim().toLowerCase();
        quotations = quotations.filter((q) => {
          const numMatch = (q.quotationNumber || q._id || '').toLowerCase().includes(query);
          const custName =
            typeof q.customer === 'object' && q.customer !== null && 'name' in q.customer
              ? (q.customer as any).name
              : '';
          const custEmail =
            typeof q.customer === 'object' && q.customer !== null && 'email' in q.customer
              ? (q.customer as any).email
              : '';
          return numMatch || custName.toLowerCase().includes(query) || custEmail.toLowerCase().includes(query);
        });
      }

      // Filter by status (draft | sent | accepted | rejected)
      if (params?.status && params.status !== 'all') {
        const targetStatus = params.status.toLowerCase();
        quotations = quotations.filter((q) => q.status.toLowerCase() === targetStatus);
      }

      // Filter by product ObjectId
      if (params?.productId && params.productId !== 'all') {
        quotations = quotations.filter((q) => {
          const prodId = typeof q.product === 'object' && q.product !== null ? (q.product as any)._id : q.product;
          return prodId === params.productId;
        });
      }

      // Filter by plan ObjectId
      if (params?.planId && params.planId !== 'all') {
        quotations = quotations.filter((q) => {
          const plId = typeof q.plan === 'object' && q.plan !== null ? (q.plan as any)._id : q.plan;
          return plId === params.planId;
        });
      }

      // Date Range filter
      if (params?.dateRange && params.dateRange !== 'all') {
        const now = new Date();
        quotations = quotations.filter((q) => {
          if (!q.createdAt) return true;
          const created = new Date(q.createdAt);
          if (params.dateRange === '30days') {
            const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
            return diffDays <= 30;
          }
          if (params.dateRange === 'month') {
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }
          return true;
        });
      }

      const total = quotations.length;
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const paginated = quotations.slice(startIndex, startIndex + limit);

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
   * Get single quotation by ID
   */
  async getQuotationById(id: string): Promise<Quotation> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.QUOTATIONS.BY_ID(id));
      return populateQuotation(response.data);
    } catch {
      const stored = getStoredQuotations();
      const match = stored.find((q) => q._id === id || q.id === id);
      if (!match) {
        throw new Error(`Quotation not found with ID ${id}`);
      }
      return populateQuotation(match);
    }
  },

  /**
   * Create a new quotation matching exact Mongoose schema:
   * customer, product, plan, quantity, unitPrice, totalAmount, status, validUntil, createdBy
   */
  async createQuotation(dto: CreateQuotationDTO): Promise<Quotation> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.QUOTATIONS.BASE, dto);
      return populateQuotation(response.data);
    } catch {
      const quotations = getStoredQuotations();
      const count = quotations.length + 1;
      const quoteNum = `QTE-2026-${String(count).padStart(3, '0')}`;
      const newId = `6620f3c3e4b0a1a2b3c4f${Date.now().toString().slice(-3)}`;

      const newQuote: Quotation = {
        _id: newId,
        quotationNumber: quoteNum,
        customer: dto.customer,
        product: dto.product,
        plan: dto.plan,
        quantity: Math.max(1, Number(dto.quantity) || 1),
        unitPrice: Number(dto.unitPrice),
        totalAmount: Number(dto.unitPrice) * Math.max(1, Number(dto.quantity) || 1),
        status: dto.status || 'draft',
        validUntil: dto.validUntil,
        createdBy: dto.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newQuote, ...quotations];
      saveStoredQuotations(updated);
      return populateQuotation(newQuote);
    }
  },

  /**
   * Update an existing quotation
   */
  async updateQuotation(id: string, dto: UpdateQuotationDTO): Promise<Quotation> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.QUOTATIONS.BY_ID(id), dto);
      return populateQuotation(response.data);
    } catch {
      const quotations = getStoredQuotations();
      const index = quotations.findIndex((q) => q._id === id || q.id === id);
      if (index === -1) {
        throw new Error(`Quotation with ID ${id} not found.`);
      }

      const existing = quotations[index];
      const quantity = dto.quantity !== undefined ? Math.max(1, Number(dto.quantity)) : existing.quantity;
      const unitPrice = dto.unitPrice !== undefined ? Number(dto.unitPrice) : existing.unitPrice;
      const totalAmount = dto.totalAmount !== undefined ? Number(dto.totalAmount) : quantity * unitPrice;

      const updatedQuote: Quotation = {
        ...existing,
        customer: dto.customer !== undefined ? dto.customer : existing.customer,
        product: dto.product !== undefined ? dto.product : existing.product,
        plan: dto.plan !== undefined ? dto.plan : existing.plan,
        quantity,
        unitPrice,
        totalAmount,
        status: dto.status !== undefined ? dto.status : existing.status,
        validUntil: dto.validUntil !== undefined ? dto.validUntil : existing.validUntil,
        updatedAt: new Date().toISOString(),
      };

      quotations[index] = updatedQuote;
      saveStoredQuotations(quotations);
      return populateQuotation(updatedQuote);
    }
  },

  /**
   * Transition quotation from draft to sent
   */
  async sendQuotation(id: string): Promise<Quotation> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.QUOTATIONS.SEND(id));
      return populateQuotation(response.data);
    } catch {
      return this.updateQuotation(id, { status: 'sent' });
    }
  },

  /**
   * Transition quotation from sent to accepted
   */
  async acceptQuotation(id: string): Promise<Quotation> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.QUOTATIONS.ACCEPT(id));
      return populateQuotation(response.data);
    } catch {
      return this.updateQuotation(id, { status: 'accepted' });
    }
  },

  /**
   * Transition quotation to rejected
   */
  async rejectQuotation(id: string): Promise<Quotation> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.QUOTATIONS.REJECT(id));
      return populateQuotation(response.data);
    } catch {
      return this.updateQuotation(id, { status: 'rejected' });
    }
  },

  /**
   * Delete draft quotation
   */
  async deleteQuotation(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.QUOTATIONS.BY_ID(id));
      return response.data;
    } catch {
      const quotations = getStoredQuotations();
      const target = quotations.find((q) => q._id === id || q.id === id);
      if (target && target.status.toLowerCase() !== 'draft') {
        throw new Error('Only draft quotations can be deleted.');
      }
      const remaining = quotations.filter((q) => q._id !== id && q.id !== id);
      saveStoredQuotations(remaining);
      return { success: true, message: 'Draft quotation deleted successfully.' };
    }
  },
};
