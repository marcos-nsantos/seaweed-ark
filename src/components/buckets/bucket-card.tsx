'use client';

import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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

type BucketCardProps = {
  bucket: S3Bucket;
  onOpen: (bucket: S3Bucket) => void;
  onDelete: (bucket: S3Bucket) => void;
};

export function BucketCard({ bucket, onOpen, onDelete }: BucketCardProps) {
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
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <CardActionArea onClick={() => onOpen(bucket)} sx={{ flexGrow: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <FolderIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" component="h2" noWrap sx={{ fontWeight: 500 }}>
                {bucket.name}
              </Typography>
              {bucket.creationDate && (
                <Typography variant="body2" color="text.secondary">
                  Created {formatDate(bucket.creationDate)}
                </Typography>
              )}
              <Box sx={{ mt: 1 }}>
                {versioningLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <Chip
                    icon={<HistoryIcon />}
                    label={isVersioningEnabled ? 'Versioning' : 'No versioning'}
                    size="small"
                    color={isVersioningEnabled ? 'primary' : 'default'}
                    variant={isVersioningEnabled ? 'filled' : 'outlined'}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>

      <IconButton
        onClick={handleMenuClick}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}
      >
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
    </Card>
  );
}
