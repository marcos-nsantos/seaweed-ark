'use client';

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  DriveFileRenameOutline as RenameIcon,
  ContentCopy as CopyIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { formatBytes, isImageFile, isPdfFile, getFileName } from '@/lib/utils';
import type { S3Object } from '@/types/s3';

type FileGridProps = {
  files: S3Object[];
  selected: Set<string>;
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
    return <FolderIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
  }

  const fileName = getFileName(file.key);
  if (isImageFile(fileName)) {
    return <ImageIcon sx={{ fontSize: 48, color: 'success.main' }} />;
  }
  if (isPdfFile(fileName)) {
    return <PdfIcon sx={{ fontSize: 48, color: 'error.main' }} />;
  }

  return <FileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
}

export function FileGrid({
  files,
  selected,
  onSelect,
  onOpen,
  onDownload,
  onDelete,
  onRename,
  onCopy,
  onVersions,
}: FileGridProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement | null;
    file: S3Object | null;
  }>({ element: null, file: null });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: S3Object) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, file });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, file: null });
  };

  const handleAction = (action: (file: S3Object) => void) => {
    if (menuAnchor.file) {
      action(menuAnchor.file);
    }
    handleMenuClose();
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 2,
        }}
      >
        {files.map((file) => {
          const fileName = getFileName(file.key.replace(/\/$/, ''));
          const isSelected = selected.has(file.key);

          return (
            <Card
              key={file.key}
              variant="outlined"
              sx={{
                position: 'relative',
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? 'primary.main' : 'divider',
              }}
            >
              <Checkbox
                checked={isSelected}
                onChange={() => onSelect(file)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
                size="small"
              />
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, file)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
              <CardActionArea onClick={() => onOpen(file)} sx={{ p: 2 }}>
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 0,
                    '&:last-child': { pb: 0 },
                  }}
                >
                  {getFileIcon(file)}
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      width: '100%',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fileName}
                  </Typography>
                  {!file.isFolder && (
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(file.size)}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        {!menuAnchor.file?.isFolder && (
          <>
            <MenuItem onClick={() => handleAction(onDownload)}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(onVersions)}>
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Versions</ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => handleAction(onRename)}>
          <ListItemIcon>
            <RenameIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onCopy)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
