'use client';

import { api } from '../../axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { RawMaterialDoc } from '@/model/RawMaterial';
import { AxiosError } from 'axios';

interface FetchRawMaterialsParams {
  search?: string;
}

async function getRawMaterialsClient(params?: FetchRawMaterialsParams): Promise<RawMaterialDoc[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) {
    searchParams.append('search', params.search);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/raw-materials?${queryString}` : '/api/raw-materials';

  const response = await api.get<ApiResponse<RawMaterialDoc[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch raw materials');
  }
  return response.data.data || [];
}

export function useRawMaterialsQuery(params?: FetchRawMaterialsParams) {
  return useQuery({
    queryKey: ['raw-materials', params],
    queryFn: () => getRawMaterialsClient(params),
    staleTime: 1000 * 60, // 1 min
  });
}

interface CreateRawMaterialPayload {
  materialCode: string;
  date: Date | string;
  rawMaterial: string;
}

async function createRawMaterialClient(payload: CreateRawMaterialPayload): Promise<RawMaterialDoc> {
  try {
    const response = await api.post<ApiResponse<RawMaterialDoc>>('/api/raw-materials', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create raw material');
    }
    return response.data.data!;
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      throw new Error(apiResponse.message || 'Failed to create raw material');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to create raw material');
  }
}

export function useCreateRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRawMaterialClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
}

interface UpdateRawMaterialPayload {
  materialCode?: string;
  date?: Date | string;
  rawMaterial?: string;
}

async function updateRawMaterialClient(id: string, payload: UpdateRawMaterialPayload): Promise<RawMaterialDoc> {
  try {
    const response = await api.put<ApiResponse<RawMaterialDoc>>(`/api/raw-materials/${id}`, payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update raw material');
    }
    return response.data.data!;
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      throw new Error(apiResponse.message || 'Failed to update raw material');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to update raw material');
  }
}

export function useUpdateRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRawMaterialPayload }) =>
      updateRawMaterialClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
}

async function deleteRawMaterialClient(id: string): Promise<void> {
  try {
    const response = await api.delete<ApiResponse<void>>(`/api/raw-materials/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete raw material');
    }
  } catch (error) {
    // Handle axios errors (4xx, 5xx status codes)
    if (error instanceof AxiosError && error.response?.data) {
      const apiResponse = error.response.data as ApiResponse;
      throw new Error(apiResponse.message || 'Failed to delete raw material');
    }
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unknown errors
    throw new Error('Failed to delete raw material');
  }
}

export function useDeleteRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRawMaterialClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
}
