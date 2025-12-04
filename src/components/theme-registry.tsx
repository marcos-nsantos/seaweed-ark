'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { theme } from '@/lib/theme';
import { QueryProvider } from './query-provider';
import { ToastProvider } from './toast-provider';
import type { ReactNode } from 'react';

type ThemeRegistryProps = {
  children: ReactNode;
};

export function ThemeRegistry({ children }: ThemeRegistryProps) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline />
        <QueryProvider>
          {children}
          <ToastProvider />
        </QueryProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
