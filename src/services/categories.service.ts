import api from './api';
import type { Category, ApiResponse } from '../types';

export const categoriesService = {
  /**
   * Get all categories
   */
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data || [];
  },

  /**
   * Get a category by ID
   */
  getById: async (id: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    if (!response.data.data) {
      throw new Error('Category not found');
    }
    return response.data.data;
  },

  /**
   * Create a new category
   */
  create: async (data: { name: string; description?: string }): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    if (!response.data.data) {
      throw new Error('Failed to create category');
    }
    return response.data.data;
  },

  /**
   * Update a category
   */
  update: async (id: string, data: { name?: string; description?: string }): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update category');
    }
    return response.data.data;
  },

  /**
   * Delete a category
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
