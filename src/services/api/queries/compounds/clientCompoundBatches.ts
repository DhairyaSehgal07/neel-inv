// src/services/api/queries/compounds/clientCompoundBatches.ts
'use client';

import { api } from '../../axios';
import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { CompoundBatchDoc } from '@/model/CompoundBatch';

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
