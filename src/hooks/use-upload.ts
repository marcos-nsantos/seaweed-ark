'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';
import type { S3UploadProgress } from '@/types/s3';
import type { ApiResponse } from '@/types/api';

const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

type UploadOptions = {
  bucket: string;
  prefix?: string;
  onProgress?: (progress: S3UploadProgress[]) => void;
};

async function getPresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string
): Promise<string> {
  const response = await fetch('/api/s3/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket,
      key,
      operation: 'putObject',
      contentType,
    }),
  });

  const data: ApiResponse<{ url: string }> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data.url;
}

async function uploadViaPresignedUrl(
  url: string,
  file: File,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded, event.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}

export function useUpload({ bucket, prefix = '', onProgress }: UploadOptions) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<S3UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const updateUpload = useCallback(
    (id: string, update: Partial<S3UploadProgress>) => {
      setUploads((prev) => {
        const updated = prev.map((u) => (u.id === id ? { ...u, ...update } : u));
        onProgress?.(updated);
        return updated;
      });
    },
    [onProgress]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setIsUploading(true);

      const newUploads: S3UploadProgress[] = files.map((file) => ({
        id: crypto.randomUUID(),
        fileName: file.name,
        progress: 0,
        status: 'pending' as const,
      }));

      setUploads((prev) => [...prev, ...newUploads]);
      onProgress?.([...uploads, ...newUploads]);

      const uploadPromises = files.map(async (file, index) => {
        const upload = newUploads[index];
        const key = prefix ? `${prefix}${file.name}` : file.name;

        try {
          updateUpload(upload.id, { status: 'uploading' });

          if (file.size > LARGE_FILE_THRESHOLD) {
            // Use presigned URL for large files
            const url = await getPresignedUploadUrl(
              bucket,
              key,
              file.type || 'application/octet-stream'
            );

            await uploadViaPresignedUrl(url, file, (loaded, total) => {
              const progress = Math.round((loaded / total) * 100);
              updateUpload(upload.id, { progress });
            });
          } else {
            // For small files, we could use direct upload via API
            // For now, use presigned URL for all files
            const url = await getPresignedUploadUrl(
              bucket,
              key,
              file.type || 'application/octet-stream'
            );

            await uploadViaPresignedUrl(url, file, (loaded, total) => {
              const progress = Math.round((loaded / total) * 100);
              updateUpload(upload.id, { progress });
            });
          }

          updateUpload(upload.id, { status: 'completed', progress: 100 });
        } catch (error) {
          updateUpload(upload.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          });
        }
      });

      await Promise.allSettled(uploadPromises);

      queryClient.invalidateQueries({
        queryKey: queryKeys.objects.list(bucket, prefix),
      });

      setIsUploading(false);
    },
    [bucket, prefix, uploads, updateUpload, queryClient, onProgress]
  );

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setUploads([]);
  }, []);

  return {
    uploads,
    isUploading,
    uploadFiles,
    clearCompleted,
    clearAll,
  };
}
