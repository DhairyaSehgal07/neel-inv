// src/lib/api/client.ts
import axios from 'axios';
import { ApiResponse } from '@/types/apiResponse';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (can add auth tokens here if needed)
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    // Handle API errors
    const message = error.response?.data?.message || error.message || 'An error occurred';
    throw new Error(message);
  }
);

// Generic API response type
export interface ApiResponseData<T> extends ApiResponse {
  data?: T;
  count?: number;
  error?: string;
}
