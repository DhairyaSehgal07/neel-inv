// src/services/queries/ratings.ts
'use client';

import { api } from '../../axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { Rating } from '@/types/rating';

async function getRatingsClient(): Promise<Rating[]> {
  const response = await api.get<ApiResponse<Rating[]>>('/api/ratings');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch ratings');
  }
  return response.data.data || [];
}

export function useRatingsQuery() {
  return useQuery({
    queryKey: ['ratings'],
    queryFn: getRatingsClient,
    staleTime: 1000 * 60, // 1 min
  });
}

async function createRatingClient(payload: {
  rating: string;
  strength: number;
}): Promise<Rating> {
  const response = await api.post<ApiResponse<Rating>>('/api/ratings', payload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create rating');
  }
  return response.data.data!;
}

export function useCreateRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRatingClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}

async function updateRatingClient({
  id,
  payload,
}: {
  id: string;
  payload: {
    rating?: string;
    strength?: number;
  };
}): Promise<Rating> {
  const response = await api.put<ApiResponse<Rating>>(`/api/ratings/${id}`, payload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update rating');
  }
  return response.data.data!;
}

export function useUpdateRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRatingClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}

async function deleteRatingClient(id: string): Promise<Rating> {
  const response = await api.delete<ApiResponse<Rating>>(`/api/ratings/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete rating');
  }
  return response.data.data!;
}

export function useDeleteRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRatingClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}
