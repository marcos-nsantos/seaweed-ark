'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useObjectVersions } from '@/hooks/use-s3-objects';
import { formatDate, formatBytes } from '@/lib/utils';
import type { S3Object } from '@/types/s3';

type VersionsDialogProps = {
  open: boolean;
  onClose: () => void;
  file: S3Object | null;
  bucket: string;
};

export function VersionsDialog({ open, onClose, file, bucket }: VersionsDialogProps) {
  const { data: versions, isLoading, error } = useObjectVersions(bucket, file?.key ?? null);

  const handleDownloadVersion = async (versionId: string) => {
    if (!file) return;

    try {
      const response = await fetch('/api/s3/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          key: file.key,
          operation: 'getObject',
          versionId,
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      window.open(result.data.url, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download version');
    }
  };

  const fileName = file?.key.split('/').pop() ?? '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Versions: {fileName}</span>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ py: 2 }}>
            Failed to load versions
          </Typography>
        ) : !versions || versions.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No versions found. Enable versioning on the bucket to track file versions.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Version ID</TableCell>
                  <TableCell>Modified</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((version) => (
                  <TableRow
                    key={version.versionId}
                    sx={{
                      bgcolor: version.isLatest ? 'action.selected' : 'inherit',
                      opacity: version.isDeleteMarker ? 0.6 : 1,
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                      >
                        {version.versionId === 'null' ? (
                          <em style={{ fontStyle: 'italic', opacity: 0.7 }}>pre-versioning</em>
                        ) : (
                          `${version.versionId.slice(0, 16)}...`
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(version.lastModified)}</TableCell>
                    <TableCell align="right">
                      {version.isDeleteMarker ? '-' : formatBytes(version.size)}
                    </TableCell>
                    <TableCell align="center">
                      {version.isDeleteMarker ? (
                        <Chip
                          icon={<DeleteIcon />}
                          label="Deleted"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      ) : version.isLatest ? (
                        <Chip label="Latest" size="small" color="primary" />
                      ) : (
                        <Chip label="Old" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {!version.isDeleteMarker && (
                        <Tooltip title="Download this version">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadVersion(version.versionId)}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
