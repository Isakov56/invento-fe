import api from './api';
import type { ApiResponse } from '../types';

export interface SalesReportData {
  date: string;
  revenue: number;
  transactions: number;
  items: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  category?: string;
  imageUrl?: string;
  sku: string;
  size?: string;
  color?: string;
  quantitySold: number;
  revenue: number;
}

export interface PaymentMethodData {
  method: string;
  count: number;
  total: number;
  percent: number;
}

export interface InventoryValueReport {
  totalCostValue: number;
  totalSellingValue: number;
  potentialProfit: number;
  totalItems: number;
  categoryBreakdown: {
    category: string;
    costValue: number;
    sellingValue: number;
    items: number;
    potentialProfit: number;
  }[];
}

export const reportsService = {
  /**
   * Get sales report
   */
  getSalesReport: async (params?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<SalesReportData[]> => {
    const response = await api.get<ApiResponse<SalesReportData[]>>('/reports/sales', { params });
    return response.data.data || [];
  },

  /**
   * Get top selling products
   */
  getTopProducts: async (params?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    limit?: number;
  }): Promise<TopProduct[]> => {
    const response = await api.get<ApiResponse<TopProduct[]>>('/reports/top-products', {
      params,
    });
    return response.data.data || [];
  },

  /**
   * Get payment method breakdown
   */
  getPaymentMethodBreakdown: async (params?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<PaymentMethodData[]> => {
    const response = await api.get<ApiResponse<PaymentMethodData[]>>(
      '/reports/payment-methods',
      { params }
    );
    return response.data.data || [];
  },

  /**
   * Get inventory value report
   */
  getInventoryValue: async (storeId?: string): Promise<InventoryValueReport> => {
    const params = storeId ? { storeId } : undefined;
    const response = await api.get<ApiResponse<InventoryValueReport>>(
      '/reports/inventory-value',
      { params }
    );
    if (!response.data.data) {
      throw new Error('Failed to get inventory value report');
    }
    return response.data.data;
  },

  /**
   * Export report as CSV
   */
  exportCSV: async (params: {
    startDate: string;
    endDate: string;
    storeId?: string;
    sections: string[];
  }): Promise<void> => {
    const response = await api.post('/reports/export/csv', params, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export report as PDF
   */
  exportPDF: async (params: {
    startDate: string;
    endDate: string;
    storeId?: string;
    sections: string[];
  }): Promise<void> => {
    const response = await api.post('/reports/export/pdf', params, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
