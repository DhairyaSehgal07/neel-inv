// src/services/queries/belts.ts
'use client';

import { api } from '../../axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { BeltFormData } from '@/types/belt';
import { BeltDoc } from '@/model/Belt';
import { AxiosError } from 'axios';

interface FetchBeltsParams {
  status?: string;
  search?: string;
}

async function getBeltsClient(params?: FetchBeltsParams): Promise<BeltDoc[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) {
    searchParams.append('status', params.status);
  }
  if (params?.search) {
    searchParams.append('search', params.search);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/belts?${queryString}` : '/api/belts';

  const response = await api.get<ApiResponse<BeltDoc[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch belts');
  }
  return response.data.data || [];
}

export function useBeltsQuery(params?: FetchBeltsParams) {
  return useQuery({
    queryKey: ['belts', params],
    queryFn: () => getBeltsClient(params),
    staleTime: 1000 * 60, // 1 min
  });
}

interface CreateBeltPayload {
  formData: BeltFormData;
  coverCompoundCode?: string;
  skimCompoundCode?: string;
  coverConsumedKg: number;
  skimConsumedKg: number;
}

async function createBeltClient(payload: CreateBeltPayload): Promise<void> {
  try {
    const response = await api.post<ApiResponse<void>>('/api/belts', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create belt');
    }
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      // Extract validation errors if present
      if (apiResponse.data && typeof apiResponse.data === 'object') {
        const validationErrors = apiResponse.data as Record<string, unknown>;
        // Format validation errors into a readable message
        const errorMessages = Object.entries(validationErrors)
          .map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            if (typeof errors === 'object' && errors !== null) {
              return `${field}: ${Object.values(errors).join(', ')}`;
            }
            return `${field}: ${String(errors)}`;
          })
          .join('; ');
        throw new Error(errorMessages || apiResponse.message || 'Validation failed');
      }
      throw new Error(apiResponse.message || 'Failed to create belt');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to create belt');
  }
}

export function useCreateBeltMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBeltClient,
    onSuccess: () => {
      // Invalidate belts queries if you have any
      queryClient.invalidateQueries({ queryKey: ['belts'] });
    },
  });
}

interface UpdateBeltPayload {
  formData: BeltFormData;
  coverCompoundCode?: string;
  skimCompoundCode?: string;
  coverConsumedKg?: number;
  skimConsumedKg?: number;
}

async function updateBeltClient(id: string, payload: UpdateBeltPayload): Promise<BeltDoc> {
  try {
    const response = await api.put<ApiResponse<BeltDoc>>(`/api/belts/${id}`, payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update belt');
    }
    return response.data.data!;
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      throw new Error(apiResponse.message || 'Failed to update belt');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to update belt');
  }
}

export function useUpdateBeltMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBeltPayload }) =>
      updateBeltClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['belts'] });
    },
  });
}

interface CreateManualBeltPayload {
  formData: BeltFormData;
  coverBatches: Array<{ batchId: string; consumedKg: number }>;
  skimBatches: Array<{ batchId: string; consumedKg: number }>;
}

async function createManualBeltClient(payload: CreateManualBeltPayload): Promise<void> {
  try {
    const response = await api.post<ApiResponse<void>>('/api/belts/manual', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create belt');
    }
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      // Extract validation errors if present
      if (apiResponse.data && typeof apiResponse.data === 'object') {
        const validationErrors = apiResponse.data as Record<string, unknown>;
        // Format validation errors into a readable message
        const errorMessages = Object.entries(validationErrors)
          .map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            if (typeof errors === 'object' && errors !== null) {
              return `${field}: ${Object.values(errors).join(', ')}`;
            }
            return `${field}: ${String(errors)}`;
          })
          .join('; ');
        throw new Error(errorMessages || apiResponse.message || 'Validation failed');
      }
      throw new Error(apiResponse.message || 'Failed to create belt');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to create belt');
  }
}

export function useCreateManualBeltMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createManualBeltClient,
    onSuccess: () => {
      // Invalidate belts queries and available compounds
      queryClient.invalidateQueries({ queryKey: ['belts'] });
      queryClient.invalidateQueries({ queryKey: ['availableCompounds'] });
      queryClient.invalidateQueries({ queryKey: ['compoundBatches'] });
    },
  });
}
