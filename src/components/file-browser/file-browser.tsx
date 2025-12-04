'use client';

import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Skeleton,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  CreateNewFolder as CreateFolderIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useObjects, useCreateFolder, useDeleteObject } from '@/hooks/use-s3-objects';
import { useUpload } from '@/hooks/use-upload';
import { BreadcrumbNav } from './breadcrumb-nav';
import { FileRow } from './file-row';
import { FileGrid } from './file-grid';
import { UploadDropzone } from '@/components/upload/upload-dropzone';
import { UploadProgress } from '@/components/upload/upload-progress';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FilePreviewModal } from './file-preview-modal';
import { RenameDialog } from './rename-dialog';
import { VersionsDialog } from './versions-dialog';
import { CopyDialog } from './copy-dialog';
import { ShareDialog } from './share-dialog';
import type { S3Object } from '@/types/s3';

type FileBrowserProps = {
  bucket: string;
  path: string[];
  onNavigate: (path: string[]) => void;
};

export function FileBrowser({ bucket, path, onNavigate }: FileBrowserProps) {
  const prefix = path.length > 0 ? `${path.join('/')}/` : '';
  const { data, isLoading, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useObjects(bucket, prefix);
  const createFolder = useCreateFolder();
  const deleteObject = useDeleteObject();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showUpload, setShowUpload] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<S3Object | null>(null);
  const [previewFile, setPreviewFile] = useState<S3Object | null>(null);
  const [renameTarget, setRenameTarget] = useState<S3Object | null>(null);
  const [versionsTarget, setVersionsTarget] = useState<S3Object | null>(null);
  const [copyTarget, setCopyTarget] = useState<S3Object | null>(null);
  const [shareTarget, setShareTarget] = useState<S3Object | null>(null);

  const { uploads, isUploading, uploadFiles, clearAll } = useUpload({
    bucket,
    prefix,
  });

  // Flatten paginated results
  const objects = data?.pages.flatMap((page) => page.objects) || [];

  const handleSelect = (file: S3Object) => {
    const newSelected = new Set(selected);
    if (newSelected.has(file.key)) {
      newSelected.delete(file.key);
    } else {
      newSelected.add(file.key);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === objects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(objects.map((o) => o.key)));
    }
  };

  const handleOpen = (file: S3Object) => {
    if (file.isFolder) {
      const folderName = file.key.replace(prefix, '').replace(/\/$/, '');
      onNavigate([...path, folderName]);
    } else {
      setPreviewFile(file);
    }
  };

  const handleDownload = async (file: S3Object) => {
    try {
      const response = await fetch('/api/s3/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          key: file.key,
          operation: 'getObject',
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      window.open(result.data.url, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteObject.mutateAsync({ bucket, key: deleteTarget.key });
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.key);
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderPath = prefix + newFolderName.trim();
      await createFolder.mutateAsync({ bucket, path: folderPath });
      toast.success(`Folder "${newFolderName}" created`);
      setNewFolderName('');
      setCreateFolderOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleRename = (file: S3Object) => {
    setRenameTarget(file);
  };

  const handleCopy = (file: S3Object) => {
    setCopyTarget(file);
  };

  const handleVersions = (file: S3Object) => {
    setVersionsTarget(file);
  };

  const handleShare = (file: S3Object) => {
    setShareTarget(file);
  };

  return (
    <Box>
      <BreadcrumbNav bucket={bucket} path={path} />

      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          mb: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          gap: 1,
        }}
      >
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setShowUpload(!showUpload)}
        >
          Upload
        </Button>

        <Button
          variant="outlined"
          startIcon={<CreateFolderIcon />}
          onClick={() => setCreateFolderOpen(true)}
        >
          New Folder
        </Button>

        {selected.size > 0 && (
          <Tooltip title="Delete selected">
            <IconButton
              color="error"
              onClick={() => {
                const firstSelected = objects.find((o) => selected.has(o.key));
                if (firstSelected) setDeleteTarget(firstSelected);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="list">
            <ListViewIcon />
          </ToggleButton>
          <ToggleButton value="grid">
            <GridViewIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>

      {showUpload && (
        <Box sx={{ mb: 3 }}>
          <UploadDropzone onDrop={uploadFiles} disabled={isUploading} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load files. Please try again.
        </Alert>
      )}

      {isLoading ? (
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell padding="checkbox">
                    <Skeleton variant="rectangular" width={20} height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="60%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={60} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : objects.length > 0 ? (
        viewMode === 'grid' ? (
          <FileGrid
            files={objects}
            selected={selected}
            onSelect={handleSelect}
            onOpen={handleOpen}
            onDownload={handleDownload}
            onDelete={setDeleteTarget}
            onRename={handleRename}
            onCopy={handleCopy}
            onVersions={handleVersions}
            onShare={handleShare}
          />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.size > 0 && selected.size < objects.length}
                      checked={objects.length > 0 && selected.size === objects.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell>Modified</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {objects.map((file) => (
                  <FileRow
                    key={file.key}
                    file={file}
                    selected={selected.has(file.key)}
                    onSelect={handleSelect}
                    onOpen={handleOpen}
                    onDownload={handleDownload}
                    onDelete={setDeleteTarget}
                    onRename={handleRename}
                    onCopy={handleCopy}
                    onVersions={handleVersions}
                    onShare={handleShare}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            This folder is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload files or create a folder to get started
          </Typography>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setShowUpload(true)}>
            Upload Files
          </Button>
        </Paper>
      )}

      {/* Load More */}
      {hasNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </Box>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)}>
        <DialogTitle>Create Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim() || createFolder.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete"
        message={`Are you sure you want to delete "${deleteTarget?.key.replace(/\/$/, '').split('/').pop()}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteObject.isPending}
        variant="danger"
      />

      {/* Upload Progress */}
      <UploadProgress uploads={uploads} onClear={clearAll} />

      {/* File Preview */}
      <FilePreviewModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        bucket={bucket}
      />

      {/* Rename Dialog */}
      <RenameDialog
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        file={renameTarget}
        bucket={bucket}
      />

      {/* Versions Dialog */}
      <VersionsDialog
        open={!!versionsTarget}
        onClose={() => setVersionsTarget(null)}
        file={versionsTarget}
        bucket={bucket}
      />

      {/* Copy Dialog */}
      <CopyDialog
        open={!!copyTarget}
        onClose={() => setCopyTarget(null)}
        file={copyTarget}
        bucket={bucket}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        file={shareTarget}
        bucket={bucket}
      />
    </Box>
  );
}
