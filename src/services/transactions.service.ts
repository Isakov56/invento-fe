import api from './api';
import type { Transaction, PaymentMethod, TransactionType, ApiResponse } from '../types';

interface CreateTransactionData {
  storeId: string;
  cashierId: string;
  type?: TransactionType;
  items: {
    productVariantId: string;
    quantity: number;
    discount?: number;
  }[];
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  tax?: number;
  discount?: number;
  notes?: string;
}

interface TransactionStats {
  totalRevenue: number;
  totalTransactions: number;
  todayRevenue: number;
  todayTransactions: number;
}

export const transactionsService = {
  /**
   * Get all transactions with optional filters
   */
  getAll: async (params?: {
    storeId?: string;
    cashierId?: string;
    type?: TransactionType;
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> => {
    const response = await api.get<ApiResponse<Transaction[]>>('/transactions', { params });
    return response.data.data || [];
  },

  /**
   * Get a transaction by ID
   */
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    if (!response.data.data) {
      throw new Error('Transaction not found');
    }
    return response.data.data;
  },

  /**
   * Create a new transaction (sale)
   */
  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await api.post<ApiResponse<Transaction>>('/transactions', data);
    if (!response.data.data) {
      throw new Error('Failed to create transaction');
    }
    return response.data.data;
  },

  /**
   * Get transaction statistics
   */
  getStats: async (params?: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionStats> => {
    const response = await api.get<ApiResponse<TransactionStats>>('/transactions/stats', {
      params,
    });
    if (!response.data.data) {
      throw new Error('Failed to get statistics');
    }
    return response.data.data;
  },

  /**
   * Get today's transactions
   */
  getToday: async (storeId?: string): Promise<Transaction[]> => {
    const params = storeId ? { storeId } : undefined;
    const response = await api.get<ApiResponse<Transaction[]>>('/transactions/today', { params });
    return response.data.data || [];
  },
};
