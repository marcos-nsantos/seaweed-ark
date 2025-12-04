'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';

type CreateBucketDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isLoading: boolean;
};

export function CreateBucketDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}: CreateBucketDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate bucket name
    if (name.length < 3 || name.length > 63) {
      setError('Bucket name must be between 3 and 63 characters');
      return;
    }

    if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(name)) {
      setError(
        'Bucket name must start and end with a letter or number, and can only contain lowercase letters, numbers, hyphens, and periods'
      );
      return;
    }

    try {
      await onSubmit(name);
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket');
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Bucket</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Bucket Name"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            fullWidth
            required
            margin="normal"
            placeholder="my-bucket-name"
            helperText="Lowercase letters, numbers, hyphens, and periods only"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading || !name}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
