'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';

type CredentialsDialogProps = {
  open: boolean;
  onClose: () => void;
  userName: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function CredentialsDialog({
  open,
  onClose,
  userName,
  accessKeyId,
  secretAccessKey,
}: CredentialsDialogProps) {
  const [showSecret, setShowSecret] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllCredentials = () => {
    const text = `Access Key ID: ${accessKeyId}\nSecret Access Key: ${secretAccessKey}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>User Credentials</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Save these credentials now. The secret access key will not be shown again.
        </Alert>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          User Name
        </Typography>
        <Typography variant="body1" fontWeight={500} sx={{ mb: 2 }}>
          {userName}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Access Key ID"
            value={accessKeyId}
            fullWidth
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => copyToClipboard(accessKeyId, 'Access Key ID')}>
                    <CopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Secret Access Key"
            value={secretAccessKey}
            type={showSecret ? 'text' : 'password'}
            fullWidth
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                  <IconButton onClick={() => copyToClipboard(secretAccessKey, 'Secret Access Key')}>
                    <CopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={copyAllCredentials} startIcon={<CopyIcon />}>
          Copy All
        </Button>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
