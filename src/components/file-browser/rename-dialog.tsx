'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { toast } from 'sonner';
import { useRenameObject } from '@/hooks/use-s3-objects';
import { getFileName, getParentPath } from '@/lib/utils';
import type { S3Object } from '@/types/s3';

type RenameDialogProps = {
  open: boolean;
  onClose: () => void;
  file: S3Object | null;
  bucket: string;
};

export function RenameDialog({ open, onClose, file, bucket }: RenameDialogProps) {
  const [newName, setNewName] = useState('');
  const renameObject = useRenameObject();

  useEffect(() => {
    if (file) {
      const name = getFileName(file.key.replace(/\/$/, ''));
      setNewName(name);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !newName.trim()) return;

    const trimmedName = newName.trim();
    const currentName = getFileName(file.key.replace(/\/$/, ''));

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    const parentPath = getParentPath(file.key.replace(/\/$/, ''));
    const destKey = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
    const finalDestKey = file.isFolder ? `${destKey}/` : destKey;

    try {
      await renameObject.mutateAsync({
        bucket,
        sourceKey: file.key,
        destKey: finalDestKey,
      });
      toast.success(`Renamed to "${trimmedName}"`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rename');
    }
  };

  const handleClose = () => {
    setNewName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Rename {file?.isFolder ? 'Folder' : 'File'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={renameObject.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={renameObject.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!newName.trim() || renameObject.isPending}
          >
            {renameObject.isPending ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
