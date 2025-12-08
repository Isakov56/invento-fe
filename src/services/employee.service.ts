import api from './api';
import type { ApiResponse } from '../types';
import { UserRole } from '../types';

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  storeId?: string;
  store?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  storeId: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeId?: string;
  isActive?: boolean;
}

export const employeeService = {
  /**
   * Create a new employee
   */
  createEmployee: async (data: CreateEmployeeData): Promise<Employee> => {
    const response = await api.post<ApiResponse<Employee>>('/auth/employees', data);
    if (!response.data.data) {
      throw new Error('Failed to create employee');
    }
    return response.data.data;
  },

  /**
   * Get all employees
   */
  getAllEmployees: async (): Promise<Employee[]> => {
    const response = await api.get<ApiResponse<Employee[]>>('/auth/employees');
    return response.data.data || [];
  },

  /**
   * Update employee
   */
  updateEmployee: async (id: string, data: UpdateEmployeeData): Promise<Employee> => {
    const response = await api.put<ApiResponse<Employee>>(`/auth/employees/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update employee');
    }
    return response.data.data;
  },

  /**
   * Delete employee
   */
  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/auth/employees/${id}`);
  },
};
