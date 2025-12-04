'use client';

import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useColorScheme } from '@mui/material/styles';

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
      <IconButton onClick={toggleTheme} color="inherit" sx={{ color: 'text.primary' }}>
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}
