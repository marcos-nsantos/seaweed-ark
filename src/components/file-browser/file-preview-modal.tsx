'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { isImageFile, isPdfFile, getFileName, formatBytes } from '@/lib/utils';
import type { S3Object } from '@/types/s3';

type FilePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  file: S3Object | null;
  bucket: string;
};

export function FilePreviewModal({ open, onClose, file, bucket }: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open && file && !file.isFolder) {
      loadPreview();
    } else {
      setPreviewUrl(null);
      setZoom(1);
    }
  }, [open, file]);

  const loadPreview = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const response = await fetch('/api/s3/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          key: file.key,
          operation: 'getObject',
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPreviewUrl(result.data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load preview');
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  if (!file) return null;

  const fileName = getFileName(file.key);
  const isImage = isImageFile(fileName);
  const isPdf = isPdfFile(fileName);
  const canPreview = isImage || isPdf;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <Typography variant="h6" component="span" noWrap sx={{ flex: 1 }}>
          {fileName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatBytes(file.size)}
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography color="text.secondary">Loading preview...</Typography>
          </Box>
        ) : !canPreview ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Preview not available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This file type cannot be previewed. Download to view.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              disabled={!previewUrl}
            >
              Download
            </Button>
          </Box>
        ) : isImage && previewUrl ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              overflow: 'auto',
            }}
          >
            <img
              src={previewUrl}
              alt={fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s',
              }}
            />
          </Box>
        ) : isPdf && previewUrl ? (
          <Box
            component="iframe"
            src={previewUrl}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              flex: 1,
            }}
            title={fileName}
          />
        ) : (
          <Skeleton variant="rectangular" width="100%" height="100%" />
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box>
          {isImage && (
            <>
              <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOutIcon />
              </IconButton>
              <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                {Math.round(zoom * 100)}%
              </Typography>
              <IconButton onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomInIcon />
              </IconButton>
            </>
          )}
        </Box>
        <Box>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!previewUrl}
          >
            Download
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
