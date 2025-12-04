'use client';

import {
  TableRow,
  TableCell,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Folder as FolderIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { useBucketVersioning, useSetBucketVersioning } from '@/hooks/use-buckets';
import type { S3Bucket } from '@/types/s3';

type BucketRowProps = {
  bucket: S3Bucket;
  onOpen: (bucket: S3Bucket) => void;
  onDelete: (bucket: S3Bucket) => void;
};

export function BucketRow({ bucket, onOpen, onDelete }: BucketRowProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const { data: versioningStatus, isLoading: versioningLoading } = useBucketVersioning(bucket.name);
  const setVersioning = useSetBucketVersioning();

  const isVersioningEnabled = versioningStatus === 'Enabled';

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(bucket);
  };

  const handleToggleVersioning = () => {
    handleMenuClose();
    setVersioning.mutate({ bucket: bucket.name, enabled: !isVersioningEnabled });
  };

  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onOpen(bucket)}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FolderIcon sx={{ color: 'primary.main' }} />
          <Typography noWrap>{bucket.name}</Typography>
        </Box>
      </TableCell>

      <TableCell>{bucket.creationDate ? formatDate(bucket.creationDate) : '-'}</TableCell>

      <TableCell>
        {versioningLoading ? (
          <CircularProgress size={16} />
        ) : (
          <Chip
            icon={<HistoryIcon />}
            label={isVersioningEnabled ? 'Enabled' : 'Disabled'}
            size="small"
            color={isVersioningEnabled ? 'primary' : 'default'}
            variant={isVersioningEnabled ? 'filled' : 'outlined'}
          />
        )}
      </TableCell>

      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <IconButton size="small" onClick={handleMenuClick}>
          <MoreVertIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleToggleVersioning} disabled={setVersioning.isPending}>
            <ListItemIcon>
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {isVersioningEnabled ? 'Disable versioning' : 'Enable versioning'}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'inherit' }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
