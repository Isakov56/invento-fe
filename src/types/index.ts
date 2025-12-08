// User types
export const UserRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  storeId?: string;
  store?: Store;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phone?: string;
  storeId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Store types
export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  storeId: string;
  store?: Store;
  brand?: string;
  imageUrl?: string;
  isActive: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  product?: Product;
  sku: string;
  size?: string;
  color?: string;
  barcode?: string;
  qrCode?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  MOBILE_PAYMENT: 'MOBILE_PAYMENT',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const TransactionType = {
  SALE: 'SALE',
  RETURN: 'RETURN',
  REFUND: 'REFUND',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export interface Transaction {
  id: string;
  transactionNo: string;
  type: TransactionType;
  storeId: string;
  store?: Store;
  cashierId: string;
  cashier?: User;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  notes?: string;
  items: TransactionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  createdAt: string;
}

// Cart types (frontend only)
export interface CartItem {
  variantId: string;
  variant: ProductVariant;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Dashboard types
export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalTransactions: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockCount: number;
  totalInventoryValue: number;
}

export interface SalesChartData {
  date: string;
  revenue: number;
  transactions: number;
}

export interface TopSellingProduct {
  product: Product;
  variant: ProductVariant;
  quantitySold: number;
  revenue: number;
}
