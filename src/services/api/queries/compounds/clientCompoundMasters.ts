// src/services/queries/compoundMasters.ts
'use client';

import { api } from '../../axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { CompoundMaster } from '@/types/compound-master';

async function getCompoundMastersClient(): Promise<CompoundMaster[]> {
  const response = await api.get<ApiResponse<CompoundMaster[]>>('/api/compounds/master');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch compound masters');
  }
  return response.data.data || [];
}

export function useCompoundMastersQuery() {
  return useQuery({
    queryKey: ['compoundMasters'],
    queryFn: getCompoundMastersClient,
    staleTime: 1000 * 60, // 1 min
  });
}

async function createCompoundMasterClient(payload: {
  compoundCode: string;
  compoundName: string;
  category: 'skim' | 'cover';
  defaultWeightPerBatch: number;
}): Promise<CompoundMaster> {
  const response = await api.post<ApiResponse<CompoundMaster>>('/api/compounds/master', payload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create compound master');
  }
  return response.data.data!;
}

export function useCreateCompoundMasterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompoundMasterClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compoundMasters'] });
    },
  });
}

async function updateCompoundMasterClient({
  id,
  payload,
}: {
  id: string;
  payload: {
    compoundCode?: string;
    compoundName?: string;
    category?: 'skim' | 'cover';
    defaultWeightPerBatch?: number;
  };
}): Promise<CompoundMaster> {
  const response = await api.put<ApiResponse<CompoundMaster>>(`/api/compounds/master/${id}`, payload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update compound master');
  }
  return response.data.data!;
}

export function useUpdateCompoundMasterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompoundMasterClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compoundMasters'] });
    },
  });
}

async function deleteCompoundMasterClient(id: string): Promise<CompoundMaster> {
  const response = await api.delete<ApiResponse<CompoundMaster>>(`/api/compounds/master/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete compound master');
  }
  return response.data.data!;
}

export function useDeleteCompoundMasterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompoundMasterClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compoundMasters'] });
    },
  });
}