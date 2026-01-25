// src/services/queries/users.ts
'use client';

import { api } from '../../axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/apiResponse';
import { User } from '@/types/user';

async function getUsersClient(): Promise<User[]> {
  const response = await api.get<ApiResponse<User[]>>('/api/users');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch users');
  }
  return response.data.data || [];
}

export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsersClient,
    staleTime: 1000 * 60, // 1 min
  });
}

async function updateUserClient({
  id,
  payload,
}: {
  id: string;
  payload: {
    role?: string;
    permissions?: string[];
    isActive?: boolean;
  };
}): Promise<User> {
  const response = await api.put<ApiResponse<User>>(`/api/users/${id}`, payload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update user');
  }
  return response.data.data!;
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

async function deleteUserClient(id: string): Promise<void> {
  const response = await api.delete<ApiResponse>(`/api/users/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete user');
  }
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

async function createUserClient(payload: {
  name: string;
  mobileNumber: string;
  password: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
}): Promise<User> {
  const response = await api.post<ApiResponse<User>>('/api/users', payload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create user');
  }
  return response.data.data!;
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
