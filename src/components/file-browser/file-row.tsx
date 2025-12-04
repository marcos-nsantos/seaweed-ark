'use client';

import {
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  DriveFileRenameOutline as RenameIcon,
  ContentCopy as CopyIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { formatBytes, formatDate, getFileExtension, isImageFile, isPdfFile } from '@/lib/utils';
import type { S3Object } from '@/types/s3';

type FileRowProps = {
  file: S3Object;
  selected: boolean;
  onSelect: (file: S3Object) => void;
  onOpen: (file: S3Object) => void;
  onDownload: (file: S3Object) => void;
  onDelete: (file: S3Object) => void;
  onRename: (file: S3Object) => void;
  onCopy: (file: S3Object) => void;
  onVersions: (file: S3Object) => void;
};

function getFileIcon(file: S3Object) {
  if (file.isFolder) {
    return <FolderIcon sx={{ color: 'primary.main' }} />;
  }

  const fileName = file.key.split('/').pop() || '';

  if (isImageFile(fileName)) {
    return <ImageIcon sx={{ color: 'success.main' }} />;
  }

  if (isPdfFile(fileName)) {
    return <PdfIcon sx={{ color: 'error.main' }} />;
  }

  return <FileIcon sx={{ color: 'text.secondary' }} />;
}

function getDisplayName(file: S3Object): string {
  const parts = file.key.split('/').filter(Boolean);
  const name = parts[parts.length - 1] || file.key;
  return file.isFolder ? name : name;
}

export function FileRow({
  file,
  selected,
  onSelect,
  onOpen,
  onDownload,
  onDelete,
  onRename,
  onCopy,
  onVersions,
}: FileRowProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => () => {
    handleMenuClose();
    action();
  };

  const displayName = getDisplayName(file);

  return (
    <TableRow hover selected={selected} sx={{ cursor: 'pointer' }} onClick={() => onOpen(file)}>
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={() => onSelect(file)} />
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {getFileIcon(file)}
          <Typography noWrap>{displayName}</Typography>
        </Box>
      </TableCell>

      <TableCell align="right">{file.isFolder ? '-' : formatBytes(file.size)}</TableCell>

      <TableCell>{formatDate(file.lastModified)}</TableCell>

      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <IconButton size="small" onClick={handleMenuClick}>
          <MoreVertIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {!file.isFolder && (
            <>
              <MenuItem onClick={handleAction(() => onDownload(file))}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download</ListItemText>
              </MenuItem>

              <MenuItem onClick={handleAction(() => onVersions(file))}>
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Versions</ListItemText>
              </MenuItem>
            </>
          )}

          <MenuItem onClick={handleAction(() => onRename(file))}>
            <ListItemIcon>
              <RenameIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleAction(() => onCopy(file))}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleAction(() => onDelete(file))} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'inherit' }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
