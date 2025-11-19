// src/lib/api/belts.ts
import { apiClient, ApiResponseData } from './client';
import { Belt } from '@/lib/data';

const API_BASE_URL = '/api/belts';

/**
 * Fetch all belts with optional filters
 */
export async function fetchBelts(params?: {
  status?: string;
  search?: string;
}): Promise<Belt[]> {
  try {
    const response = await apiClient.get<ApiResponseData<Belt[]>>(API_BASE_URL, {
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
    const response = await apiClient.get<ApiResponseData<Belt>>(`${API_BASE_URL}/${id}`);

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
    const response = await apiClient.post<ApiResponseData<Belt>>(API_BASE_URL, belt);

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
    const response = await apiClient.put<ApiResponseData<Belt>>(`${API_BASE_URL}/${id}`, belt);

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
    const response = await apiClient.delete<ApiResponseData<void>>(`${API_BASE_URL}/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete belt');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete belt';
    throw new Error(errorMessage);
  }
}
