import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Folder as FolderIcon,
  Apple as AppleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface ICloudFolderSelectorProps {
  open: boolean;
  onClose: () => void;
  onFolderSelect: (folderPath: string) => void;
  currentFolderPath?: string;
}

interface WatchedFolder {
  path: string;
  name: string;
  status: 'watching' | 'error' | 'stopped';
  lastSync?: string;
  fileCount?: number;
}

export const ICloudFolderSelector: React.FC<ICloudFolderSelectorProps> = ({
  open,
  onClose,
  onFolderSelect,
  currentFolderPath
}) => {
  const [watchedFolders, setWatchedFolders] = useState<WatchedFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMacOS, setIsMacOS] = useState(false);

  useEffect(() => {
    // Check if running on macOS
    setIsMacOS(navigator.platform.includes('Mac'));
    if (open) {
      loadWatchedFolders();
    }
  }, [open]);

  const loadWatchedFolders = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load saved watched folders from localStorage
      const saved = localStorage.getItem('icloud_watched_folders');
      if (saved) {
        const folders = JSON.parse(saved);
        setWatchedFolders(folders);
      }
    } catch (err) {
      setError('Failed to load watched folders');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      // Use Electron's dialog to select folder
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('select-folder');
      
      if (result && result.filePaths && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        
        // Check if it's an iCloud Drive folder
        if (folderPath.includes('iCloud Drive') || folderPath.includes('Library/Mobile Documents')) {
          onFolderSelect(folderPath);
          onClose();
        } else {
          setError('Please select a folder within iCloud Drive for proper sync functionality.');
        }
      }
    } catch (err) {
      setError('Failed to select folder. Please ensure you have permission to access the selected location.');
    }
  };

  const handleRemoveFolder = (folderPath: string) => {
    const updatedFolders = watchedFolders.filter(folder => folder.path !== folderPath);
    setWatchedFolders(updatedFolders);
    localStorage.setItem('icloud_watched_folders', JSON.stringify(updatedFolders));
  };

  const getFolderName = (path: string): string => {
    const parts = path.split('/');
    return parts[parts.length - 1] || 'iCloud Drive';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return 'success';
      case 'error': return 'error';
      case 'stopped': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'watching': return <CheckCircleIcon />;
      case 'error': return <WarningIcon />;
      case 'stopped': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  if (!isMacOS) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AppleIcon sx={{ mr: 1 }} />
            <Typography variant="h6">iCloud Sync</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              iCloud sync is only available on macOS. This feature uses folder watching to sync files 
              placed in your iCloud Drive folders.
            </Typography>
          </Alert>
          <Typography variant="body2" color="textSecondary">
            Please use macOS to access iCloud sync functionality.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <AppleIcon sx={{ mr: 1 }} />
          <Typography variant="h6">iCloud Folder Sync</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Information Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>How iCloud sync works:</strong> Since iCloud doesn't provide a public API, 
            we use folder watching to detect files placed in your iCloud Drive folders. 
            Files you place in the selected folder will be automatically imported into your research notebook.
          </Typography>
        </Alert>

        {/* Current Folder */}
        {currentFolderPath && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Currently Watching:
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <FolderIcon sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {getFolderName(currentFolderPath)}
                </Typography>
              </Box>
              <Chip 
                label="Active" 
                color="success" 
                size="small" 
                icon={<CheckCircleIcon />}
              />
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {currentFolderPath}
            </Typography>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Watched Folders List */}
        <Typography variant="subtitle1" gutterBottom>
          Watched Folders
        </Typography>
        
        {watchedFolders.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              No folders are currently being watched. Select a folder to start iCloud sync.
            </Typography>
          </Paper>
        ) : (
          <List>
            {watchedFolders.map((folder) => (
              <ListItem key={folder.path} divider>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText
                  primary={folder.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {folder.path}
                      </Typography>
                      {folder.lastSync && (
                        <Typography variant="caption" color="textSecondary">
                          Last sync: {new Date(folder.lastSync).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={folder.status}
                    color={getStatusColor(folder.status) as any}
                    size="small"
                    icon={getStatusIcon(folder.status)}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFolder(folder.path)}
                  >
                    Remove
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSelectFolder}
          startIcon={<FolderIcon />}
        >
          Select iCloud Folder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ICloudFolderSelector; 