'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';
import type { S3ListObjectsResponse, S3ObjectVersion } from '@/types/s3';
import type { ApiResponse } from '@/types/api';

type ListObjectsParams = {
  bucket: string;
  prefix?: string;
  continuationToken?: string;
};

async function fetchObjects(params: ListObjectsParams): Promise<S3ListObjectsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('bucket', params.bucket);
  if (params.prefix) searchParams.set('prefix', params.prefix);
  if (params.continuationToken) searchParams.set('continuationToken', params.continuationToken);

  const response = await fetch(`/api/s3/objects?${searchParams}`);
  const data: ApiResponse<S3ListObjectsResponse> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data;
}

type CreateFolderParams = {
  bucket: string;
  path: string;
};

async function createFolder(params: CreateFolderParams): Promise<void> {
  const response = await fetch('/api/s3/objects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: ApiResponse<{ created: boolean }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }
}

type DeleteObjectParams = {
  bucket: string;
  key: string;
};

async function deleteObject(params: DeleteObjectParams): Promise<void> {
  const response = await fetch('/api/s3/objects', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: ApiResponse<{ deleted: boolean }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }
}

type CopyObjectParams = {
  sourceBucket: string;
  sourceKey: string;
  destBucket: string;
  destKey: string;
};

async function copyObject(params: CopyObjectParams): Promise<void> {
  const response = await fetch('/api/s3/objects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: ApiResponse<{ copied: boolean }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }
}

export function useObjects(bucket: string, prefix?: string) {
  return useQuery({
    queryKey: queryKeys.objects.list(bucket, prefix),
    queryFn: () => fetchObjects({ bucket, prefix }),
    enabled: !!bucket,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolder,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.objects.list(variables.bucket),
      });
    },
  });
}

export function useDeleteObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteObject,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.objects.list(variables.bucket),
      });
    },
  });
}

export function useCopyObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: copyObject,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.objects.list(variables.destBucket),
      });
    },
  });
}

type RenameObjectParams = {
  bucket: string;
  sourceKey: string;
  destKey: string;
};

async function renameObject(params: RenameObjectParams): Promise<void> {
  const response = await fetch('/api/s3/objects', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: ApiResponse<{ renamed: boolean }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }
}

export function useRenameObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameObject,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.objects.list(variables.bucket),
      });
    },
  });
}

async function fetchObjectVersions(bucket: string, key: string): Promise<S3ObjectVersion[]> {
  const response = await fetch(
    `/api/s3/objects/${encodeURIComponent(key)}/versions?bucket=${encodeURIComponent(bucket)}`
  );
  const data: ApiResponse<S3ObjectVersion[]> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data;
}

export function useObjectVersions(bucket: string, key: string | null) {
  return useQuery({
    queryKey: queryKeys.objects.versions(bucket, key ?? ''),
    queryFn: () => fetchObjectVersions(bucket, key!),
    enabled: !!bucket && !!key,
  });
}
