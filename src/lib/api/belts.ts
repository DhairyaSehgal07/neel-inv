// src/lib/api/belts.ts
import axios from 'axios';
import { Belt } from '@/lib/data';

const API_BASE_URL = '/api/belts';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// Create axios instance with default config
const apiClient = axios.create({
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

/**
 * Fetch all belts with optional filters
 */
export async function fetchBelts(params?: {
  status?: string;
  search?: string;
}): Promise<Belt[]> {
  try {
    const response = await apiClient.get<ApiResponse<Belt[]>>(API_BASE_URL, {
      params,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch belts');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch belts';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch a single belt by ID
 */
export async function fetchBeltById(id: string): Promise<Belt> {
  try {
    const response = await apiClient.get<ApiResponse<Belt>>(`${API_BASE_URL}/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Belt not found');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch belt';
    throw new Error(errorMessage);
  }
}

/**
 * Create a new belt
 */
export async function createBelt(belt: Omit<Belt, 'id' | 'createdAt'>): Promise<Belt> {
  try {
    const response = await apiClient.post<ApiResponse<Belt>>(API_BASE_URL, belt);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create belt');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create belt';
    throw new Error(errorMessage);
  }
}

/**
 * Update an existing belt
 */
export async function updateBelt(id: string, belt: Partial<Belt>): Promise<Belt> {
  try {
    const response = await apiClient.put<ApiResponse<Belt>>(`${API_BASE_URL}/${id}`, belt);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update belt');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update belt';
    throw new Error(errorMessage);
  }
}

/**
 * Delete a belt by ID
 */
export async function deleteBelt(id: string): Promise<void> {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(`${API_BASE_URL}/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete belt');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete belt';
    throw new Error(errorMessage);
  }
}
