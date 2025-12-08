import api from './api';
import type { ApiResponse } from '../types';

interface QRCodeData {
  variantId: string;
  sku: string;
  productName: string;
  qrCodeDataURL: string;
  qrData?: string;
}

export const qrcodeService = {
  /**
   * Generate QR code for a variant
   */
  generateForVariant: async (variantId: string): Promise<QRCodeData> => {
    const response = await api.get<ApiResponse<QRCodeData>>(`/qrcode/variant/${variantId}`);
    if (!response.data.data) {
      throw new Error('Failed to generate QR code');
    }
    return response.data.data;
  },

  /**
   * Generate QR codes for multiple variants
   */
  generateBulk: async (variantIds: string[]): Promise<QRCodeData[]> => {
    const response = await api.post<ApiResponse<QRCodeData[]>>('/qrcode/bulk', { variantIds });
    return response.data.data || [];
  },

  /**
   * Generate QR codes or barcodes for all variants of a product
   */
  generateForProduct: async (productId: string, codeType: 'qrcode' | 'barcode' = 'qrcode'): Promise<QRCodeData[]> => {
    const response = await api.get<ApiResponse<QRCodeData[]>>(`/qrcode/product/${productId}`, {
      params: { codeType },
    });
    return response.data.data || [];
  },

  /**
   * Decode QR code data
   */
  decode: async (qrData: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/qrcode/decode', { qrData });
    return response.data.data;
  },
};
