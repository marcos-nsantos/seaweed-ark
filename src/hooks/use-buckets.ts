'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';
import type { S3Bucket } from '@/types/s3';
import type { ApiResponse } from '@/types/api';

async function fetchBuckets(): Promise<S3Bucket[]> {
  const response = await fetch('/api/s3/buckets');
  const data: ApiResponse<S3Bucket[]> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data;
}

async function createBucket(name: string): Promise<{ name: string }> {
  const response = await fetch('/api/s3/buckets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const data: ApiResponse<{ name: string }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data;
}

async function deleteBucket(name: string): Promise<void> {
  const response = await fetch('/api/s3/buckets', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const data: ApiResponse<{ deleted: boolean }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }
}

export function useBuckets() {
  return useQuery({
    queryKey: queryKeys.buckets.list(),
    queryFn: fetchBuckets,
  });
}

export function useCreateBucket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBucket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
    },
  });
}

export function useDeleteBucket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBucket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all });
    },
  });
}

export type VersioningStatus = 'Enabled' | 'Suspended' | 'Disabled';

async function fetchBucketVersioning(bucket: string): Promise<VersioningStatus> {
  const response = await fetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/versioning`);
  const data: ApiResponse<{ bucket: string; status: VersioningStatus }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data.status;
}

async function setBucketVersioning({
  bucket,
  enabled,
}: {
  bucket: string;
  enabled: boolean;
}): Promise<VersioningStatus> {
  const response = await fetch(`/api/s3/buckets/${encodeURIComponent(bucket)}/versioning`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });

  const data: ApiResponse<{ bucket: string; status: VersioningStatus }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data.status;
}

export function useBucketVersioning(bucket: string) {
  return useQuery({
    queryKey: queryKeys.buckets.versioning(bucket),
    queryFn: () => fetchBucketVersioning(bucket),
    enabled: !!bucket,
  });
}

export function useSetBucketVersioning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setBucketVersioning,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buckets.versioning(variables.bucket),
      });
    },
  });
}
