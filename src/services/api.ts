import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useToastStore } from '../store/toastStore';
import i18n from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error || error.response?.data?.message;

    if (status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      useToastStore.getState().error(i18n.t('auth.sessionExpired'));
      window.location.href = '/login';
    } else if (status === 403) {
      // Forbidden - user doesn't have permission
      useToastStore.getState().warning(
        errorMessage || i18n.t('auth.noPermission')
      );
    } else if (status === 404) {
      // Not found
      useToastStore.getState().error(errorMessage || i18n.t('errors.resourceNotFound'));
    } else if (status === 400) {
      // Bad request
      useToastStore.getState().error(errorMessage || i18n.t('errors.invalidRequest'));
    } else if (status && status >= 500) {
      // Server error
      useToastStore.getState().error(i18n.t('errors.serverError'));
    } else if (error.message === 'Network Error') {
      // Network error
      useToastStore.getState().error(i18n.t('errors.networkError'));
    }

    return Promise.reject(error);
  }
);

export default api;
