'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { toast } from 'sonner';
import { useCreateUser } from '@/hooks/use-users';

type CreateUserDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: { userName: string; accessKeyId: string; secretAccessKey: string }) => void;
};

export function CreateUserDialog({ open, onClose, onSuccess }: CreateUserDialogProps) {
  const [userName, setUserName] = useState('');
  const createUser = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim()) {
      toast.error('User name is required');
      return;
    }

    try {
      const result = await createUser.mutateAsync(userName.trim());
      toast.success(`User "${result.userName}" created`);
      onSuccess(result);
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handleClose = () => {
    setUserName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create IAM User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User Name"
            fullWidth
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g., backup-service"
            helperText="A unique name for the IAM user"
            disabled={createUser.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={createUser.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={createUser.isPending}>
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
