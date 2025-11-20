// src/services/queries/belts.ts
'use client';

import { api } from '../../axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { BeltFormData } from '@/types/belt';

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
