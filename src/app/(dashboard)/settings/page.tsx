'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Button,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { CheckCircle as ConnectedIcon, Error as ErrorIcon } from '@mui/icons-material';
import { toast } from 'sonner';

type SessionInfo = {
  authenticated: boolean;
  endpoint?: string;
};

export default function SettingsPage() {
  const { mode, setMode } = useColorScheme();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'ok' | 'error' | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const res = await fetch('/api/s3/buckets');
      if (res.ok) {
        setConnectionStatus('ok');
        toast.success('Connection is working');
      } else {
        setConnectionStatus('error');
        toast.error('Connection failed');
      }
    } catch {
      setConnectionStatus('error');
      toast.error('Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem divider>
            <ListItemText
              primary="S3 Endpoint"
              secondary={loading ? <Skeleton width={200} /> : session?.endpoint || 'Not connected'}
            />
            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                size="small"
                onClick={handleTestConnection}
                disabled={testingConnection || !session?.authenticated}
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </ListItemSecondaryAction>
          </ListItem>

          {connectionStatus && (
            <ListItem>
              <Alert
                severity={connectionStatus === 'ok' ? 'success' : 'error'}
                icon={connectionStatus === 'ok' ? <ConnectedIcon /> : <ErrorIcon />}
                sx={{ width: '100%' }}
              >
                {connectionStatus === 'ok'
                  ? 'Connection to S3 endpoint is working'
                  : 'Failed to connect to S3 endpoint'}
              </Alert>
            </ListItem>
          )}

          <ListItem divider>
            <ListItemText primary="Connection Status" secondary="Current session status" />
            <ListItemSecondaryAction>
              <Chip
                label={session?.authenticated ? 'Connected' : 'Disconnected'}
                color={session?.authenticated ? 'success' : 'default'}
                size="small"
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      <Typography variant="h6" gutterBottom fontWeight={500}>
        Appearance
      </Typography>

      <Paper>
        <List>
          <ListItem divider>
            <ListItemText primary="Dark Mode" secondary="Toggle between light and dark theme" />
            <ListItemSecondaryAction>
              <Switch
                checked={mode === 'dark'}
                onChange={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText primary="Current Theme" secondary="Active color scheme" />
            <ListItemSecondaryAction>
              <Chip
                label={mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System'}
                variant="outlined"
                size="small"
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        Ark v0.1.0
      </Typography>
    </Box>
  );
}
