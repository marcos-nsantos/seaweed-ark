'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@mui/material/styles';

export function ToastProvider() {
  const theme = useTheme();

  return (
    <Toaster
      position="bottom-right"
      theme={theme.palette.mode}
      toastOptions={{
        style: {
          fontFamily: theme.typography.fontFamily,
        },
      }}
    />
  );
}
