'use client';

import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Sidebar, DRAWER_WIDTH } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
