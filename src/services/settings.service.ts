import api from './api';
import type { ApiResponse } from '../types';

// Business Settings interface
export interface BusinessSettings {
  id: string;
  businessName: string | null;
  businessLogo: string | null;
  taxRate: number;
  currency: string;
  receiptHeader: string | null;
  receiptFooter: string | null;
  autoPrintReceipt: boolean;
  defaultPaymentMethod: string;
  soundOnTransaction: boolean;
  lowStockThreshold: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// User Preferences interface
export interface UserPreferences {
  id: string;
  language: string | null;
  theme: string | null;
  notificationsEnabled: boolean;
  defaultStoreId: string | null;
}

export const settingsService = {
  /**
   * Get business settings (OWNER only)
   */
  getBusinessSettings: async (): Promise<BusinessSettings> => {
    const response = await api.get<ApiResponse<BusinessSettings>>('/settings/business');
    if (!response.data.data) {
      throw new Error('Failed to retrieve business settings');
    }
    return response.data.data;
  },

  /**
   * Update business settings (OWNER only)
   */
  updateBusinessSettings: async (data: Partial<Omit<BusinessSettings, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>): Promise<BusinessSettings> => {
    const response = await api.put<ApiResponse<BusinessSettings>>('/settings/business', data);
    if (!response.data.data) {
      throw new Error('Failed to update business settings');
    }
    return response.data.data;
  },

  /**
   * Get user preferences
   */
  getUserPreferences: async (): Promise<UserPreferences> => {
    const response = await api.get<ApiResponse<UserPreferences>>('/settings/user');
    if (!response.data.data) {
      throw new Error('Failed to retrieve user preferences');
    }
    return response.data.data;
  },

  /**
   * Update user preferences
   */
  updateUserPreferences: async (data: Partial<Omit<UserPreferences, 'id'>>): Promise<UserPreferences> => {
    const response = await api.put<ApiResponse<UserPreferences>>('/settings/user', data);
    if (!response.data.data) {
      throw new Error('Failed to update user preferences');
    }
    return response.data.data;
  },
};
