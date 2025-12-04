'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, alpha } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

type UploadDropzoneProps = {
  onDrop: (files: File[]) => void;
  disabled?: boolean;
};

export function UploadDropzone({ onDrop, disabled = false }: UploadDropzoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles);
      }
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    disabled,
    noClick: false,
  });

  return (
    <Box
      {...getRootProps()}
      sx={(theme) => ({
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
        '&:hover': {
          borderColor: disabled ? 'divider' : 'primary.main',
          bgcolor: disabled ? 'transparent' : alpha(theme.palette.primary.main, 0.02),
        },
      })}
    >
      <input {...getInputProps()} />
      <UploadIcon
        sx={{
          fontSize: 48,
          color: isDragActive ? 'primary.main' : 'text.secondary',
          mb: 1,
        }}
      />
      <Typography variant="body1" color={isDragActive ? 'primary.main' : 'text.primary'}>
        {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Upload multiple files at once
      </Typography>
    </Box>
  );
}
