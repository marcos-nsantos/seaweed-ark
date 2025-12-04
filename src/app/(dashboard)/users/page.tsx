'use client';

import { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Skeleton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Key as KeyIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useUsers, useDeleteUser, useRegenerateCredentials } from '@/hooks/use-users';
import { formatDate } from '@/lib/utils';
import type { IAMUser } from '@/types/iam';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { CredentialsDialog } from '@/components/users/credentials-dialog';
import { PermissionsDialog } from '@/components/users/permissions-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const regenerateCredentials = useRegenerateCredentials();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [credentialsDialog, setCredentialsDialog] = useState<{
    open: boolean;
    accessKeyId: string;
    secretAccessKey: string;
    userName: string;
  }>({ open: false, accessKeyId: '', secretAccessKey: '', userName: '' });
  const [permissionsDialog, setPermissionsDialog] = useState<{
    open: boolean;
    user: IAMUser | null;
  }>({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: IAMUser | null;
  }>({ open: false, user: null });

  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement | null;
    user: IAMUser | null;
  }>({ element: null, user: null });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: IAMUser) => {
    setMenuAnchor({ element: event.currentTarget, user });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, user: null });
  };

  const handleUserCreated = (result: {
    userName: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) => {
    setCredentialsDialog({
      open: true,
      accessKeyId: result.accessKeyId,
      secretAccessKey: result.secretAccessKey,
      userName: result.userName,
    });
  };

  const handleRegenerateCredentials = async () => {
    const user = menuAnchor.user;
    if (!user) return;
    handleMenuClose();

    try {
      const result = await regenerateCredentials.mutateAsync(user.userId);
      setCredentialsDialog({
        open: true,
        accessKeyId: result.accessKeyId,
        secretAccessKey: result.secretAccessKey,
        userName: user.userName,
      });
      toast.success('Credentials regenerated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate credentials');
    }
  };

  const handleOpenPermissions = () => {
    const user = menuAnchor.user;
    if (!user) return;
    handleMenuClose();
    setPermissionsDialog({ open: true, user });
  };

  const handleDeleteClick = () => {
    const user = menuAnchor.user;
    if (!user) return;
    handleMenuClose();
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    const user = deleteDialog.user;
    if (!user) return;

    try {
      await deleteUser.mutateAsync(user.userId);
      toast.success(`User "${user.userName}" deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (error) {
    return (
      <Box>
        <Typography color="error">
          Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          IAM Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Access Key ID</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={180} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton width={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.userId} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{user.userName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                      >
                        {user.accessKeyId}
                      </Typography>
                      <Tooltip title="Copy Access Key ID">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(user.accessKeyId, 'Access Key ID')}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.permissions.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.permissions.slice(0, 2).map((p) => (
                          <Chip key={p.bucket} label={p.bucket} size="small" variant="outlined" />
                        ))}
                        {user.permissions.length > 2 && (
                          <Chip
                            label={`+${user.permissions.length - 2}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No permissions
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No users found. Create your first IAM user.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenPermissions}>
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Permissions</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRegenerateCredentials}>
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Regenerate Credentials</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleUserCreated}
      />

      <CredentialsDialog
        open={credentialsDialog.open}
        onClose={() =>
          setCredentialsDialog({ open: false, accessKeyId: '', secretAccessKey: '', userName: '' })
        }
        userName={credentialsDialog.userName}
        accessKeyId={credentialsDialog.accessKeyId}
        secretAccessKey={credentialsDialog.secretAccessKey}
      />

      <PermissionsDialog
        open={permissionsDialog.open}
        onClose={() => setPermissionsDialog({ open: false, user: null })}
        user={permissionsDialog.user}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteDialog.user?.userName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, user: null })}
        isLoading={deleteUser.isPending}
        variant="danger"
      />
    </Box>
  );
}
