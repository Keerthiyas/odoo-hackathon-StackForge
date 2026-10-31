import { apiClient } from './api';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from './mockData';

const PRODUCTS_KEY = 'brightloop_products_v3';

function getStoredProducts(): Product[] {
  try {
    const item = localStorage.getItem(PRODUCTS_KEY);
    if (!item) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(item) as Product[];
  } catch {
    return INITIAL_PRODUCTS;
  }
}

function setStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.warn('Could not persist products:', err);
  }
}

export const productService = {
  async getProducts(params?: { search?: string; status?: string }): Promise<Product[]> {
    let list: Product[] = [];
    try {
      const res = await apiClient.get<Product[]>('/products', { params });
      if (res.data && Array.isArray(res.data)) {
        list = res.data;
      }
    } catch {
      // Backend offline; load local store
      list = getStoredProducts();
    }

    if (params?.search) {
      const term = params.search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    if (params?.status && params.status !== 'all') {
      list = list.filter(p => p.status === params.status);
    }

    return list;
  },

  async getProductById(id: string): Promise<Product> {
    try {
      const res = await apiClient.get<Product>(`/products/${id}`);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const products = getStoredProducts();
    const product = products.find(p => p._id === id);
    if (!product) throw new Error(`Product not found: ${id}`);
    return product;
  },

  async createProduct(data: {
    name: string;
    code: string;
    description: string;
    basePrice?: number;
    status?: 'active' | 'inactive';
  }): Promise<Product> {
    try {
      const res = await apiClient.post<Product>('/products', data);
      if (res.data && res.data._id) return res.data;
    } catch {
      // Offline fallback
    }

    const randomHex = Math.random().toString(16).substring(2, 10) + Date.now().toString(16).padStart(16, '0');
    const newProduct: Product = {
      _id: randomHex.substring(0, 24),
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      basePrice: data.basePrice || 0,
      status: data.status || 'active',
    };

    const products = getStoredProducts();
    const updated = [newProduct, ...products];
    setStoredProducts(updated);
    return newProduct;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const res = await apiClient.put<Product>(`/products/${id}`, data);
      if (res.data) return res.data;
    } catch {
      // Offline fallback
    }

    const products = getStoredProducts();
    const index = products.findIndex(p => p._id === id);
    if (index === -1) throw new Error('Product not found');

    const updated = { ...products[index], ...data };
    products[index] = updated;
    setStoredProducts(products);
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch {
      // Offline fallback
    }

    const products = getStoredProducts();
    const filtered = products.filter(p => p._id !== id);
    setStoredProducts(filtered);
    return true;
  },
};
