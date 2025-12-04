'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { toast } from 'sonner';
import { useBuckets } from '@/hooks/use-buckets';
import { useMoveObject } from '@/hooks/use-s3-objects';
import { getFileName } from '@/lib/utils';
import type { S3Object } from '@/types/s3';

type MoveDialogProps = {
  open: boolean;
  onClose: () => void;
  file: S3Object | null;
  bucket: string;
};

export function MoveDialog({ open, onClose, file, bucket }: MoveDialogProps) {
  const { data: buckets } = useBuckets();
  const moveObject = useMoveObject();

  const fileName = file ? getFileName(file.key.replace(/\/$/, '')) : '';
  const [destBucket, setDestBucket] = useState(bucket);
  const [destPath, setDestPath] = useState('');
  const [destName, setDestName] = useState(fileName);

  // Reset when file changes
  const [lastFileKey, setLastFileKey] = useState<string | null>(null);
  if (file && file.key !== lastFileKey) {
    setLastFileKey(file.key);
    setDestBucket(bucket);
    setDestPath('');
    setDestName(getFileName(file.key.replace(/\/$/, '')));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !destName.trim()) return;

    const trimmedName = destName.trim();
    const trimmedPath = destPath.trim().replace(/^\/+|\/+$/g, '');
    const destKey = trimmedPath ? `${trimmedPath}/${trimmedName}` : trimmedName;
    const finalDestKey = file.isFolder ? `${destKey}/` : destKey;

    // Check if moving to same location with same name
    if (destBucket === bucket && finalDestKey === file.key) {
      toast.error('Cannot move to the same location');
      return;
    }

    try {
      await moveObject.mutateAsync({
        sourceBucket: bucket,
        sourceKey: file.key,
        destBucket,
        destKey: finalDestKey,
      });
      toast.success(`Moved to ${destBucket}/${finalDestKey}`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move');
    }
  };

  const handleClose = () => {
    setDestPath('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Move {file?.isFolder ? 'Folder' : 'File'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Source: {bucket}/{file?.key}
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Destination Bucket</InputLabel>
              <Select
                value={destBucket}
                label="Destination Bucket"
                onChange={(e) => setDestBucket(e.target.value)}
              >
                {buckets?.map((b) => (
                  <MenuItem key={b.name} value={b.name}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Destination Path (optional)"
              placeholder="folder/subfolder"
              fullWidth
              size="small"
              value={destPath}
              onChange={(e) => setDestPath(e.target.value)}
              helperText="Leave empty to move to bucket root"
            />

            <TextField
              label="Name"
              fullWidth
              size="small"
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
              disabled={moveObject.isPending}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={moveObject.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!destName.trim() || moveObject.isPending}
          >
            {moveObject.isPending ? 'Moving...' : 'Move'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
