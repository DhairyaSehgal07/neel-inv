// src/services/api/queries/compounds/clientCompoundBatches.ts
'use client';

import { api } from '../../axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { CompoundBatchDoc } from '@/model/CompoundBatch';
import { AxiosError } from 'axios';

interface FetchCompoundBatchesParams {
  compoundCode?: string;
  date?: string;
}

async function getCompoundBatchesClient(
  params?: FetchCompoundBatchesParams
): Promise<CompoundBatchDoc[]> {
  const searchParams = new URLSearchParams();
  if (params?.compoundCode) {
    searchParams.append('compoundCode', params.compoundCode);
  }
  if (params?.date) {
    searchParams.append('date', params.date);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/compounds/batches?${queryString}`
    : '/api/compounds/batches';

  const response = await api.get<ApiResponse<CompoundBatchDoc[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch compound batches');
  }
  return response.data.data || [];
}

export function useCompoundBatchesQuery(params?: FetchCompoundBatchesParams) {
  return useQuery({
    queryKey: ['compoundBatches', params],
    queryFn: () => getCompoundBatchesClient(params),
    staleTime: 1000 * 60, // 1 min
  });
}

interface UpdateCompoundBatchPayload {
  compoundCode?: string;
  compoundName?: string;
  batches?: number;
  weightPerBatch?: number;
  reducedQty?: number;
}

async function updateCompoundBatchClient(
  id: string,
  payload: UpdateCompoundBatchPayload
): Promise<CompoundBatchDoc> {
  try {
    const response = await api.put<ApiResponse<CompoundBatchDoc>>(`/api/compounds/batches/${id}`, payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update compound batch');
    }
    return response.data.data!;
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      throw new Error(apiResponse.message || 'Failed to update compound batch');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to update compound batch');
  }
}

export function useUpdateCompoundBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompoundBatchPayload }) =>
      updateCompoundBatchClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compoundBatches'] });
    },
  });
}

interface CreateCompoundBatchPayload {
  compoundCode: string;
  compoundName?: string;
  batches: number;
  weightPerBatch: number;
  coverCompoundProducedOn?: string;
  skimCompoundProducedOn?: string;
}

async function createCompoundBatchClient(
  payload: CreateCompoundBatchPayload
): Promise<CompoundBatchDoc> {
  try {
    const response = await api.post<ApiResponse<CompoundBatchDoc>>('/api/compounds/batches', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create compound batch');
    }
    return response.data.data!;
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      throw new Error(apiResponse.message || 'Failed to create compound batch');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to create compound batch');
  }
}

export function useCreateCompoundBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompoundBatchClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compoundBatches'] });
      queryClient.invalidateQueries({ queryKey: ['availableCompounds'] });
    },
  });
}
