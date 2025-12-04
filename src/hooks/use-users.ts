'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';
import type { IAMUser, CreateUserResponse, IAMAction } from '@/types/iam';

async function fetchUsers(): Promise<IAMUser[]> {
  const response = await fetch('/api/iam/users');

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error ?? 'Failed to fetch users');
  }

  return response.json();
}

async function createUser(userName: string): Promise<CreateUserResponse> {
  const response = await fetch('/api/iam/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error ?? 'Failed to create user');
  }

  return response.json();
}

async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/iam/users?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error ?? 'Failed to delete user');
  }
}

async function regenerateCredentials(
  userId: string
): Promise<{ accessKeyId: string; secretAccessKey: string }> {
  const response = await fetch(`/api/iam/users/${userId}/regenerate`, {
    method: 'POST',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error ?? 'Failed to regenerate credentials');
  }

  return response.json();
}

async function updatePermissions(
  userId: string,
  permissions: Array<{ bucket: string; actions: IAMAction[] }>
): Promise<void> {
  const response = await fetch(`/api/iam/users/${userId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error ?? 'Failed to update permissions');
  }
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useRegenerateCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateCredentials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: Array<{ bucket: string; actions: IAMAction[] }>;
    }) => updatePermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
