// src/lib/api/compound-type.ts
import { apiClient, ApiResponseData } from './client';
import { CompoundCategory } from '@/model/CompoundType';

// Client-side type for CompoundType (without mongoose Document properties)
export interface CompoundType {
  _id: string;
  name: string;
  type: CompoundCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = '/api/compounds/type';

/**
 * Fetch all compound types
 */
export async function fetchCompoundTypes(): Promise<CompoundType[]> {
  try {
    const response = await apiClient.get<ApiResponseData<CompoundType[]>>(API_BASE_URL);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch compound types');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch compound types';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch a single compound type by ID
 */
export async function fetchCompoundTypeById(id: string): Promise<CompoundType> {
  try {
    const response = await apiClient.get<ApiResponseData<CompoundType>>(`${API_BASE_URL}/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Compound type not found');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch compound type';
    throw new Error(errorMessage);
  }
}

/**
 * Create a new compound type
 */
export async function createCompoundType(
  compoundType: Omit<CompoundType, '_id' | 'createdAt' | 'updatedAt'>
): Promise<CompoundType> {
  try {
    const response = await apiClient.post<ApiResponseData<CompoundType>>(API_BASE_URL, compoundType);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create compound type');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create compound type';
    throw new Error(errorMessage);
  }
}

/**
 * Update an existing compound type
 */
export async function updateCompoundType(
  id: string,
  compoundType: Partial<Omit<CompoundType, '_id' | 'createdAt' | 'updatedAt'>>
): Promise<CompoundType> {
  try {
    const response = await apiClient.put<ApiResponseData<CompoundType>>(
      `${API_BASE_URL}/${id}`,
      compoundType
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update compound type');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update compound type';
    throw new Error(errorMessage);
  }
}

/**
 * Delete a compound type by ID (soft delete)
 */
export async function deleteCompoundType(id: string): Promise<void> {
  try {
    const response = await apiClient.delete<ApiResponseData<void>>(`${API_BASE_URL}/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete compound type');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete compound type';
    throw new Error(errorMessage);
  }
}
