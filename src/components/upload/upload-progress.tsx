'use client';

import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { S3UploadProgress } from '@/types/s3';

type UploadProgressProps = {
  uploads: S3UploadProgress[];
  onClear: () => void;
};

function getStatusColor(status: S3UploadProgress['status']) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'error':
      return 'error';
    case 'uploading':
      return 'primary';
    default:
      return 'default';
  }
}

function getStatusIcon(status: S3UploadProgress['status']) {
  switch (status) {
    case 'completed':
      return <SuccessIcon color="success" fontSize="small" />;
    case 'error':
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return null;
  }
}

export function UploadProgress({ uploads, onClear }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter((u) => u.status === 'pending' || u.status === 'uploading');
  const hasActive = activeUploads.length > 0;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 360,
        maxHeight: 400,
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={500}>
          Uploads {hasActive && `(${activeUploads.length} active)`}
        </Typography>
        <IconButton size="small" onClick={onClear}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
        {uploads.map((upload) => (
          <ListItem key={upload.id} divider>
            <ListItemText
              disableTypography
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {upload.fileName}
                  </Typography>
                  {getStatusIcon(upload.status)}
                </Box>
              }
              secondary={
                upload.status === 'uploading' ? (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={upload.progress}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {upload.progress}%
                    </Typography>
                  </Box>
                ) : upload.error ? (
                  <Typography variant="caption" color="error">
                    {upload.error}
                  </Typography>
                ) : null
              }
            />
            <Chip
              size="small"
              label={upload.status}
              color={getStatusColor(upload.status)}
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
