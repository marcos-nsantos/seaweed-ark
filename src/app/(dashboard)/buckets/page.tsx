'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Button, Grid, Skeleton, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import { useBuckets, useCreateBucket, useDeleteBucket } from '@/hooks/use-buckets';
import { BucketCard } from '@/components/buckets/bucket-card';
import { CreateBucketDialog } from '@/components/buckets/create-bucket-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { S3Bucket } from '@/types/s3';

export default function BucketsPage() {
  const router = useRouter();
  const { data: buckets, isLoading, error } = useBuckets();
  const createBucket = useCreateBucket();
  const deleteBucket = useDeleteBucket();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<S3Bucket | null>(null);

  const handleOpenBucket = (bucket: S3Bucket) => {
    router.push(`/buckets/${bucket.name}`);
  };

  const handleCreateBucket = async (name: string) => {
    await createBucket.mutateAsync(name);
    toast.success(`Bucket "${name}" created successfully`);
  };

  const handleDeleteBucket = async () => {
    if (!deleteTarget) return;

    try {
      await deleteBucket.mutateAsync(deleteTarget.name);
      toast.success(`Bucket "${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete bucket');
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Buckets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Bucket
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load buckets. Please try again.
        </Alert>
      )}

      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      ) : buckets && buckets.length > 0 ? (
        <Grid container spacing={2}>
          {buckets.map((bucket) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={bucket.name}>
              <BucketCard bucket={bucket} onOpen={handleOpenBucket} onDelete={setDeleteTarget} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6" gutterBottom>
            No buckets yet
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Create your first bucket to start storing files
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Bucket
          </Button>
        </Box>
      )}

      <CreateBucketDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateBucket}
        isLoading={createBucket.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Bucket"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone. The bucket must be empty.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteBucket}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteBucket.isPending}
        variant="danger"
      />
    </Box>
  );
}
