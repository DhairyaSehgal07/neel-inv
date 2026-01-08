// src/services/api/queries/compounds/clientAvailableCompounds.ts
'use client';

import { api } from '../../axios';
import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { CompoundBatchDoc } from '@/model/CompoundBatch';

async function getAvailableCompoundsClient(): Promise<CompoundBatchDoc[]> {
  const response = await api.get<ApiResponse<CompoundBatchDoc[]>>('/api/compounds/available');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch available compounds');
  }
  return response.data.data || [];
}

export function useAvailableCompoundsQuery() {
  return useQuery({
    queryKey: ['availableCompounds'],
    queryFn: getAvailableCompoundsClient,
    staleTime: 1000 * 60, // 1 min
  });
}
