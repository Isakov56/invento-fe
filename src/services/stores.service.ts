import api from './api';
import type { Store, ApiResponse } from '../types';

export const storesService = {
  /**
   * Get all stores
   */
  getAll: async (): Promise<Store[]> => {
    const response = await api.get<ApiResponse<Store[]>>('/stores');
    return response.data.data || [];
  },

  /**
   * Get a store by ID
   */
  getById: async (id: string): Promise<Store> => {
    const response = await api.get<ApiResponse<Store>>(`/stores/${id}`);
    if (!response.data.data) {
      throw new Error('Store not found');
    }
    return response.data.data;
  },

  /**
   * Create a new store
   */
  create: async (data: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email?: string;
  }): Promise<Store> => {
    const response = await api.post<ApiResponse<Store>>('/stores', data);
    if (!response.data.data) {
      throw new Error('Failed to create store');
    }
    return response.data.data;
  },

  /**
   * Update a store
   */
  update: async (
    id: string,
    data: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      phone?: string;
      email?: string;
      isActive?: boolean;
    }
  ): Promise<Store> => {
    const response = await api.put<ApiResponse<Store>>(`/stores/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update store');
    }
    return response.data.data;
  },

  /**
   * Delete a store
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/stores/${id}`);
  },
};
