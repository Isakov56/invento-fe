import api from './api';
import type { ApiResponse } from '../types';

interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export const uploadService = {
  /**
   * Upload a single image
   */
  uploadImage: async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ApiResponse<UploadedFile>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.data) {
      throw new Error('Failed to upload image');
    }

    return response.data.data;
  },

  /**
   * Upload multiple images
   */
  uploadMultipleImages: async (files: File[]): Promise<UploadedFile[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post<ApiResponse<UploadedFile[]>>('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.data) {
      throw new Error('Failed to upload images');
    }

    return response.data.data;
  },

  /**
   * Delete an uploaded image
   */
  deleteImage: async (filename: string): Promise<void> => {
    await api.delete(`/upload/image/${filename}`);
  },

  /**
   * Get full image URL
   * Handles both Cloudinary URLs and local uploads
   */
  getImageUrl: (path: string): string => {
    if (!path) return '';
    
    // If already a full URL (http/https), return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a Cloudinary path (contains res.cloudinary.com), reconstruct the URL
    if (path.includes('res.cloudinary.com')) {
      return `https://${path}`;
    }
    
    // For local uploads, prepend API base URL
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${API_BASE.replace('/api', '')}${path}`;
  },
};
