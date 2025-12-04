'use client';

import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import NextLink from 'next/link';

type BreadcrumbNavProps = {
  bucket: string;
  path: string[];
};

export function BreadcrumbNav({ bucket, path }: BreadcrumbNavProps) {
  const buildPath = (index: number) => {
    const pathParts = path.slice(0, index + 1);
    return `/buckets/${bucket}/${pathParts.join('/')}`;
  };

  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
      <Link
        component={NextLink}
        href="/buckets"
        color="inherit"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        underline="hover"
      >
        <HomeIcon fontSize="small" />
        Buckets
      </Link>

      {path.length === 0 ? (
        <Typography color="text.primary" fontWeight={500}>
          {bucket}
        </Typography>
      ) : (
        <Link component={NextLink} href={`/buckets/${bucket}`} color="inherit" underline="hover">
          {bucket}
        </Link>
      )}

      {path.map((part, index) => {
        const isLast = index === path.length - 1;

        return isLast ? (
          <Typography key={part} color="text.primary" fontWeight={500}>
            {part}
          </Typography>
        ) : (
          <Link
            key={part}
            component={NextLink}
            href={buildPath(index)}
            color="inherit"
            underline="hover"
          >
            {part}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
