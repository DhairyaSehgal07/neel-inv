// src/services/queries/belts.ts
'use client';

import { api } from '../../axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { BeltFormData } from '@/types/belt';
import { BeltDoc } from '@/model/Belt';

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
  const response = await api.post<ApiResponse<void>>('/api/belts', payload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create belt');
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
