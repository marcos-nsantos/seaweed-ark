'use client';

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { ThemeToggle } from './theme-toggle';
import { DRAWER_WIDTH } from './sidebar';

type HeaderProps = {
  title?: string;
  onMenuClick: () => void;
};

export function Header({ title, onMenuClick }: HeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, color: 'text.primary' }}>
          {title}
        </Typography>

        <Box>
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
