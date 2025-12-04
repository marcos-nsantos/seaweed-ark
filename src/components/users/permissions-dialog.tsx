'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import { useBuckets } from '@/hooks/use-buckets';
import { useUpdatePermissions } from '@/hooks/use-users';
import type { IAMUser, IAMAction } from '@/types/iam';

type PermissionsDialogProps = {
  open: boolean;
  onClose: () => void;
  user: IAMUser | null;
};

const ALL_ACTIONS: IAMAction[] = ['Admin', 'Read', 'Write', 'List', 'Tagging'];

type PermissionEntry = {
  bucket: string;
  actions: IAMAction[];
};

export function PermissionsDialog({ open, onClose, user }: PermissionsDialogProps) {
  const { data: buckets, isLoading: bucketsLoading } = useBuckets();
  const updatePermissions = useUpdatePermissions();

  const initialPermissions = useMemo(
    () => (user ? user.permissions.map((p) => ({ ...p })) : []),
    [user]
  );
  const [permissions, setPermissions] = useState<PermissionEntry[]>(initialPermissions);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Reset when user changes
  if (user && user.userId !== lastUserId) {
    setLastUserId(user.userId);
    setPermissions(user.permissions.map((p) => ({ ...p })));
  }

  const handleAddPermission = () => {
    const availableBuckets = buckets?.filter((b) => !permissions.some((p) => p.bucket === b.name));

    if (!availableBuckets || availableBuckets.length === 0) {
      toast.error('No more buckets available to add');
      return;
    }

    setPermissions([
      ...permissions,
      { bucket: availableBuckets[0].name, actions: ['Read', 'List'] },
    ]);
  };

  const handleRemovePermission = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const handleBucketChange = (index: number, bucket: string) => {
    const updated = [...permissions];
    updated[index] = { ...updated[index], bucket };
    setPermissions(updated);
  };

  const handleActionToggle = (index: number, action: IAMAction) => {
    const updated = [...permissions];
    const current = updated[index].actions;
    if (current.includes(action)) {
      updated[index] = {
        ...updated[index],
        actions: current.filter((a) => a !== action),
      };
    } else {
      updated[index] = {
        ...updated[index],
        actions: [...current, action],
      };
    }
    setPermissions(updated);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await updatePermissions.mutateAsync({
        userId: user.userId,
        permissions,
      });
      toast.success('Permissions updated');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const usedBuckets = permissions.map((p) => p.bucket);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Permissions - {user?.userName}</DialogTitle>
      <DialogContent>
        {bucketsLoading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ mb: 2 }} />
            <Typography color="text.secondary">Loading buckets...</Typography>
          </Box>
        ) : !buckets || buckets.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            No buckets available. Create a bucket first before assigning permissions.
          </Alert>
        ) : permissions.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No permissions configured. Add permissions to allow access to buckets.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {permissions.map((permission, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Bucket</InputLabel>
                    <Select
                      value={permission.bucket}
                      label="Bucket"
                      onChange={(e) => handleBucketChange(index, e.target.value)}
                    >
                      {buckets?.map((bucket) => (
                        <MenuItem
                          key={bucket.name}
                          value={bucket.name}
                          disabled={
                            usedBuckets.includes(bucket.name) && bucket.name !== permission.bucket
                          }
                        >
                          {bucket.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Actions
                    </Typography>
                    <FormGroup row>
                      {ALL_ACTIONS.map((action) => (
                        <FormControlLabel
                          key={action}
                          control={
                            <Checkbox
                              size="small"
                              checked={permission.actions.includes(action)}
                              onChange={() => handleActionToggle(index, action)}
                            />
                          }
                          label={action}
                        />
                      ))}
                    </FormGroup>
                  </Box>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemovePermission(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {permission.actions.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {permission.actions.map((action) => (
                      <Chip key={action} label={action} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}

        {buckets && buckets.length > 0 && (
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddPermission}
            sx={{ mt: 2 }}
            disabled={bucketsLoading || permissions.length >= buckets.length}
          >
            Add Bucket Permission
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updatePermissions.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={updatePermissions.isPending}>
          {updatePermissions.isPending ? 'Saving...' : 'Save Permissions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
