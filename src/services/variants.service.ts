import api from './api';
import type { ProductVariant, ApiResponse } from '../types';

export const variantsService = {
  /**
   * Get all variants for a product
   */
  getByProductId: async (productId: string): Promise<ProductVariant[]> => {
    const response = await api.get<ApiResponse<ProductVariant[]>>(`/variants/product/${productId}`);
    return response.data.data || [];
  },

  /**
   * Get a variant by ID
   */
  getById: async (id: string): Promise<ProductVariant> => {
    const response = await api.get<ApiResponse<ProductVariant>>(`/variants/${id}`);
    if (!response.data.data) {
      throw new Error('Variant not found');
    }
    return response.data.data;
  },

  /**
   * Get a variant by SKU
   */
  getBySku: async (sku: string): Promise<ProductVariant> => {
    const response = await api.get<ApiResponse<ProductVariant>>(`/variants/sku/${sku}`);
    if (!response.data.data) {
      throw new Error('Variant not found');
    }
    return response.data.data;
  },

  /**
   * Get a variant by barcode
   */
  getByBarcode: async (barcode: string): Promise<ProductVariant> => {
    const response = await api.get<ApiResponse<ProductVariant>>(`/variants/barcode/${barcode}`);
    if (!response.data.data) {
      throw new Error('Variant not found');
    }
    return response.data.data;
  },

  /**
   * Create a new variant
   */
  create: async (
    productId: string,
    data: {
      sku: string;
      size?: string;
      color?: string;
      barcode?: string;
      qrCode?: string;
      costPrice: number;
      sellingPrice: number;
      stockQuantity?: number;
      lowStockThreshold?: number;
    }
  ): Promise<ProductVariant> => {
    const response = await api.post<ApiResponse<ProductVariant>>(
      `/variants/product/${productId}`,
      data
    );
    if (!response.data.data) {
      throw new Error('Failed to create variant');
    }
    return response.data.data;
  },

  /**
   * Update a variant
   */
  update: async (
    id: string,
    data: {
      sku?: string;
      size?: string;
      color?: string;
      barcode?: string;
      qrCode?: string;
      costPrice?: number;
      sellingPrice?: number;
      stockQuantity?: number;
      lowStockThreshold?: number;
    }
  ): Promise<ProductVariant> => {
    const response = await api.patch<ApiResponse<ProductVariant>>(`/variants/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update variant');
    }
    return response.data.data;
  },

  /**
   * Adjust stock quantity
   */
  adjustStock: async (
    id: string,
    adjustment: number,
    reason?: string
  ): Promise<{
    variant: ProductVariant;
    previousStock: number;
    adjustment: number;
    newStock: number;
    reason?: string;
  }> => {
    const response = await api.patch<
      ApiResponse<{
        variant: ProductVariant;
        previousStock: number;
        adjustment: number;
        newStock: number;
        reason?: string;
      }>
    >(`/variants/${id}/stock`, { adjustment, reason });
    if (!response.data.data) {
      throw new Error('Failed to adjust stock');
    }
    return response.data.data;
  },

  /**
   * Delete a variant
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/variants/${id}`);
  },
};
