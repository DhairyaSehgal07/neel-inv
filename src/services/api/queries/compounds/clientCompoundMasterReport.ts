'use client';

import { api } from '../../axios';
import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';

export interface CompoundMasterReportData {
  compoundCode: string;
  compoundName: string;
  producedOn: string | null;
  consumedOn: string | null;
  numberOfBatches: number;
  weightPerBatch: number;
  totalInventory: number;
  remaining: number;
  beltNumbers: string[];
}

async function getCompoundMasterReportClient(): Promise<CompoundMasterReportData[]> {
  const response = await api.get<ApiResponse<CompoundMasterReportData[]>>(
    '/api/compounds/master-report'
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch compound master report');
  }
  return response.data.data || [];
}

export function useCompoundMasterReportQuery() {
  return useQuery({
    queryKey: ['compoundMasterReport'],
    queryFn: getCompoundMasterReportClient,
    staleTime: 1000 * 60, // 1 min
  });
}
