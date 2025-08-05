import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Box,
  Divider
} from '@mui/material';
import {
  Folder as FolderIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useCloudSync } from '../../hooks/useCloudSync';
import { CloudFile } from '../../utils/cloudSyncAPI';

interface OneDriveFolderSelectorProps {
  open: boolean;
  onClose: () => void;
  onFolderSelect: (folder: { id: string; name: string; path: string }) => void;
  currentFolderId?: string;
}

interface FolderBreadcrumb {
  id: string;
  name: string;
  path: string;
}

export const OneDriveFolderSelector: React.FC<OneDriveFolderSelectorProps> = ({
  open,
  onClose,
  onFolderSelect,
  currentFolderId
}) => {
  const { listFiles, isConnected } = useCloudSync();
  const [folders, setFolders] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([
    { id: 'root', name: 'OneDrive', path: '/' }
  ]);

  useEffect(() => {
    if (open && isConnected('onedrive')) {
      loadFolders();
    }
  }, [open, isConnected]);

  const loadFolders = async (folderPath: string = '/') => {
    if (!isConnected('onedrive')) {
      setError('OneDrive not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const files = await listFiles('onedrive', folderPath);
      const folderFiles = files.filter(file => file.isFolder);
      setFolders(folderFiles);
      setCurrentPath(folderPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder: CloudFile) => {
    const newPath = folder.path;
    const newBreadcrumb: FolderBreadcrumb = {
      id: folder.id,
      name: folder.name,
      path: newPath
    };

    setBreadcrumbs(prev => [...prev, newBreadcrumb]);
    await loadFolders(newPath);
  };

  const handleBreadcrumbClick = async (breadcrumb: FolderBreadcrumb, index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    await loadFolders(breadcrumb.path);
  };

  const handleHomeClick = () => {
    setBreadcrumbs([{ id: 'root', name: 'OneDrive', path: '/' }]);
    loadFolders('/');
  };

  const handleRefresh = () => {
    loadFolders(currentPath);
  };

  const handleFolderSelect = (folder: CloudFile) => {
    onFolderSelect({
      id: folder.id,
      name: folder.name,
      path: folder.path
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Select OneDrive Folder</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Breadcrumbs */}
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link
              component="button"
              variant="body2"
              onClick={handleHomeClick}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              OneDrive
            </Link>
            {breadcrumbs.slice(1).map((breadcrumb, index) => (
              <Link
                key={breadcrumb.id}
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick(breadcrumb, index + 1)}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {breadcrumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Current folder selection */}
        {currentPath !== '/' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Current Folder:
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => onFolderSelect({
                id: breadcrumbs[breadcrumbs.length - 1]?.id || 'root',
                name: breadcrumbs[breadcrumbs.length - 1]?.name || 'OneDrive',
                path: currentPath
              })}
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              {breadcrumbs[breadcrumbs.length - 1]?.name || 'OneDrive'}
            </Button>
          </Box>
        )}

        {/* Folder list */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {folders.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No folders found"
                  secondary="This folder is empty or you don't have access to its contents."
                />
              </ListItem>
            ) : (
              folders.map((folder) => (
                <ListItem key={folder.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleFolderClick(folder)}
                    selected={currentFolderId === folder.id}
                  >
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={folder.name}
                      secondary={`Modified: ${new Date(folder.modifiedTime).toLocaleDateString()}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OneDriveFolderSelector; 