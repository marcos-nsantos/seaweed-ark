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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useObjectAcl, useSetObjectAcl } from '@/hooks/use-s3-objects';
import type { S3Object, S3CannedAcl } from '@/types/s3';

type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
  file: S3Object | null;
  bucket: string;
};

const EXPIRATION_OPTIONS = [
  { value: 3600, label: '1 hour' },
  { value: 21600, label: '6 hours' },
  { value: 86400, label: '1 day' },
  { value: 604800, label: '7 days' },
];

export function ShareDialog({ open, onClose, file, bucket }: ShareDialogProps) {
  const [expiration, setExpiration] = useState(86400);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [aclSupported, setAclSupported] = useState(true);

  const { data: acl, isLoading: aclLoading, error: aclError } = useObjectAcl(bucket, file?.key ?? null);
  const setAcl = useSetObjectAcl();

  // Sync local state with server state
  useEffect(() => {
    if (acl) {
      setIsPublic(acl.isPublic);
      setAclSupported(true);
    }
  }, [acl]);

  // Handle ACL fetch error (SeaweedFS might not support it)
  useEffect(() => {
    if (aclError) {
      setAclSupported(false);
    }
  }, [aclError]);

  const handleGenerateLink = async () => {
    if (!file) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/s3/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          key: file.key,
          operation: 'getObject',
          expiresIn: expiration,
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPresignedUrl(result.data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!presignedUrl) return;

    try {
      await navigator.clipboard.writeText(presignedUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleAclChange = async (newIsPublic: boolean) => {
    if (!file) return;

    const newAcl: S3CannedAcl = newIsPublic ? 'public-read' : 'private';

    // Optimistic update
    setIsPublic(newIsPublic);

    try {
      await setAcl.mutateAsync({ bucket, key: file.key, acl: newAcl });
      toast.success(newIsPublic ? 'Object is now public' : 'Object is now private');
    } catch (err) {
      // Revert on error
      setIsPublic(!newIsPublic);
      setAclSupported(false);
      toast.error(
        'ACL not supported. SeaweedFS may not have ACL enabled. Use presigned URLs for sharing.'
      );
      console.error('ACL error:', err);
    }
  };

  const handleClose = () => {
    setPresignedUrl(null);
    setCopied(false);
    setAclSupported(true);
    setIsPublic(false);
    onClose();
  };

  const fileName = file?.key.split('/').pop() || '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon />
          Share "{fileName}"
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* ACL Section */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isPublic ? <PublicIcon fontSize="small" /> : <LockIcon fontSize="small" />}
              Access Control
            </Typography>

            {aclLoading ? (
              <CircularProgress size={20} />
            ) : !aclSupported ? (
              <Alert severity="warning" icon={<WarningIcon />}>
                ACL is not supported by your SeaweedFS instance. Use presigned URLs below for sharing files.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isPublic}
                        onChange={(e) => handleAclChange(e.target.checked)}
                        disabled={setAcl.isPending}
                      />
                    }
                    label={isPublic ? 'Public' : 'Private'}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                    {isPublic
                      ? 'Anyone with the direct URL can access this file'
                      : 'Only authenticated users can access this file'}
                  </Typography>
                </Box>
                <Chip
                  icon={isPublic ? <PublicIcon /> : <LockIcon />}
                  label={isPublic ? 'public-read' : 'private'}
                  size="small"
                  color={isPublic ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
            )}

            {aclSupported && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Note: ACL support depends on your SeaweedFS configuration. If ACL changes don't take effect,
                use presigned URLs for temporary sharing.
              </Alert>
            )}
          </Box>

          <Divider />

          {/* Presigned URL Section */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Temporary Share Link
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generate a temporary link that expires after a set time. Works regardless of ACL settings.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Expires in</InputLabel>
                <Select
                  value={expiration}
                  label="Expires in"
                  onChange={(e) => {
                    setExpiration(e.target.value as number);
                    setPresignedUrl(null);
                  }}
                >
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
              >
                Generate Link
              </Button>
            </Box>

            {presignedUrl && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={presignedUrl}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                          <IconButton onClick={handleCopyLink} edge="end" size="small">
                            {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                          </IconButton>
                        </Tooltip>
                      ),
                    },
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  This link will expire in {EXPIRATION_OPTIONS.find((o) => o.value === expiration)?.label}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
