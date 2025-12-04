export const queryKeys = {
  buckets: {
    all: ['buckets'] as const,
    list: () => [...queryKeys.buckets.all, 'list'] as const,
    detail: (name: string) => [...queryKeys.buckets.all, 'detail', name] as const,
    versioning: (name: string) => [...queryKeys.buckets.all, 'versioning', name] as const,
  },
  objects: {
    all: ['objects'] as const,
    list: (bucket: string, prefix?: string) =>
      [...queryKeys.objects.all, 'list', bucket, prefix ?? ''] as const,
    detail: (bucket: string, key: string) =>
      [...queryKeys.objects.all, 'detail', bucket, key] as const,
    versions: (bucket: string, key: string) =>
      [...queryKeys.objects.all, 'versions', bucket, key] as const,
    acl: (bucket: string, key: string) =>
      [...queryKeys.objects.all, 'acl', bucket, key] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (userId: string) => [...queryKeys.users.all, 'detail', userId] as const,
  },
} as const;
