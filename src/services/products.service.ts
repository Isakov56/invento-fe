import api from './api';
import type { Product, ApiResponse } from '../types';

interface GetProductsParams {
  categoryId?: string;
  storeId?: string;
  isActive?: boolean;
  search?: string;
}

export const productsService = {
  /**
   * Get all products with optional filters
   */
  getAll: async (params?: GetProductsParams): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return response.data.data || [];
  },

  /**
   * Get a product by ID
   */
  getById: async (id: string): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    if (!response.data.data) {
      throw new Error('Product not found');
    }
    return response.data.data;
  },

  /**
   * Get low stock products
   */
  getLowStock: async (storeId?: string): Promise<Product[]> => {
    const params = storeId ? { storeId } : undefined;
    const response = await api.get<ApiResponse<Product[]>>('/products/low-stock', { params });
    return response.data.data || [];
  },

  /**
   * Create a new product
   */
  create: async (data: {
    name: string;
    description?: string;
    categoryId: string;
    storeId: string;
    brand?: string;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    if (!response.data.data) {
      throw new Error('Failed to create product');
    }
    return response.data.data;
  },

  /**
   * Update a product
   */
  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      categoryId?: string;
      storeId?: string;
      brand?: string;
      imageUrl?: string;
      isActive?: boolean;
    }
  ): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update product');
    }
    return response.data.data;
  },

  /**
   * Delete a product
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
