/**
 * Product API Service
 * Centralizes HTTP requests for Product Management
 * Interacts with backend API endpoints or falls back seamlessly to separated mock storage
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { CreateProductDTO, Product, UpdateProductDTO } from '../types';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredPlans,
} from '../data/productPlanMockData';

export interface ProductQueryParams {
  search?: string;
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
}

export interface PaginatedProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productService = {
  /**
   * Fetch all products with optional search, status filtering, and pagination
   */
  async getProducts(params?: ProductQueryParams): Promise<PaginatedProductsResponse> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params });
      // If backend returns array directly or paginated wrapper
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
      // Backend offline fallback using separated mock store
      let products = [...getStoredProducts()];

      // Calculate current plansCount dynamically
      const plans = getStoredPlans();
      products = products.map((p) => ({
        ...p,
        plansCount: plans.filter((pl) => {
          const prodId = typeof pl.product === 'string' ? pl.product : pl.product._id;
          return prodId === p._id;
        }).length,
      }));

      // Search filter
      if (params?.search && params.search.trim()) {
        const query = params.search.trim().toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
      }

      // Status filter
      if (params?.isActive !== undefined && params.isActive !== 'all') {
        const activeBool = params.isActive === true || String(params.isActive) === 'true';
        products = products.filter((p) => p.isActive === activeBool);
      }

      const total = products.length;
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const paginatedData = products.slice(startIndex, startIndex + limit);

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
   * Get single product by ObjectId
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id));
      return response.data;
    } catch {
      const products = getStoredProducts();
      const product = products.find((p) => p._id === id);
      if (!product) {
        throw new Error(`Product not found with ID ${id}`);
      }
      return product;
    }
  },

  /**
   * Create a new product matching Mongoose schema
   * { name, description, basePrice, isActive }
   */
  async createProduct(dto: CreateProductDTO): Promise<Product> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.BASE, dto);
      return response.data;
    } catch {
      const products = getStoredProducts();
      const newProduct: Product = {
        _id: `6620f1a1e4b0a1a2b3c4d${Date.now().toString().slice(-3)}`,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        basePrice: Number(dto.basePrice),
        isActive: dto.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plansCount: 0,
        activeSubscriptions: 0,
      };

      const updated = [newProduct, ...products];
      saveStoredProducts(updated);
      return newProduct;
    }
  },

  /**
   * Update an existing product
   */
  async updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.BY_ID(id), dto);
      return response.data;
    } catch {
      const products = getStoredProducts();
      const index = products.findIndex((p) => p._id === id);
      if (index === -1) {
        throw new Error(`Product with ID ${id} not found.`);
      }

      const updatedProduct: Product = {
        ...products[index],
        name: dto.name !== undefined ? dto.name.trim() : products[index].name,
        description: dto.description !== undefined ? dto.description.trim() : products[index].description,
        basePrice: dto.basePrice !== undefined ? Number(dto.basePrice) : products[index].basePrice,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : products[index].isActive,
        updatedAt: new Date().toISOString(),
      };

      products[index] = updatedProduct;
      saveStoredProducts(products);
      return updatedProduct;
    }
  },

  /**
   * Delete a product
   * Enforces backend constraint: Cannot delete if referenced by plans
   */
  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
      return response.data;
    } catch (err: any) {
      // Check if referenced by plans in our separate mock data
      const plans = getStoredPlans();
      const referencingPlans = plans.filter((pl) => {
        const prodId = typeof pl.product === 'string' ? pl.product : pl.product._id;
        return prodId === id;
      });

      if (referencingPlans.length > 0) {
        throw new Error(
          `Cannot delete product: Referenced by ${referencingPlans.length} active subscription plan(s). Please delete or reassign associated plans first.`
        );
      }

      const products = getStoredProducts();
      const remaining = products.filter((p) => p._id !== id);
      saveStoredProducts(remaining);
      return { success: true, message: 'Product deleted successfully.' };
    }
  },

  /**
   * Toggle product active/inactive status
   */
  async toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
    return this.updateProduct(id, { isActive });
  },
};
