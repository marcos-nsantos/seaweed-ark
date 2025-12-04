'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Image from 'next/image';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    endpoint: '',
    filerEndpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });

  const handleChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Login failed');
        return;
      }

      toast.success('Connected successfully!');
      router.push('/buckets');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Image src="/logo.png" alt="Ark" width={48} height={48} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Ark
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect to your S3 storage
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              label="S3 Endpoint"
              placeholder="http://localhost:8333"
              value={formData.endpoint}
              onChange={handleChange('endpoint')}
              required
              fullWidth
              helperText="The URL of your SeaweedFS S3 API"
            />

            <TextField
              label="Filer Endpoint"
              placeholder="http://localhost:8888"
              value={formData.filerEndpoint}
              onChange={handleChange('filerEndpoint')}
              required
              fullWidth
              helperText="The URL of your SeaweedFS Filer (for IAM management)"
            />

            <TextField
              label="Access Key ID"
              value={formData.accessKeyId}
              onChange={handleChange('accessKeyId')}
              required
              fullWidth
              autoComplete="username"
            />

            <TextField
              label="Secret Access Key"
              type={showSecret ? 'text' : 'password'}
              value={formData.secretAccessKey}
              onChange={handleChange('secretAccessKey')}
              required
              fullWidth
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSecret(!showSecret)}
                        edge="end"
                        aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
                      >
                        {showSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Region"
              value={formData.region}
              onChange={handleChange('region')}
              fullWidth
              helperText="Usually 'us-east-1' for SeaweedFS"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Connect'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
