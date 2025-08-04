import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Box,
  Chip,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Settings as SettingsIcon,
  Folder as FolderIcon,
  Refresh as RefreshIcon,
  Disconnect as DisconnectIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useCloudSync } from '../../hooks/useCloudSync';
import { CloudServiceName } from '../../utils/cloudSyncAPI';
import GoogleDriveFolderSelector from '../CloudSync/GoogleDriveFolderSelector';

interface SyncFolderConfig {
  id: string;
  name: string;
  path: string;
}

const serviceConfigs = {
  dropbox: {
    name: 'Dropbox',
    icon: '☁️',
    color: '#0061FE',
    description: 'Sync your research files with Dropbox cloud storage'
  },
  google: {
    name: 'Google Drive',
    icon: '📁',
    color: '#4285F4',
    description: 'Sync your research files with Google Drive cloud storage'
  },
  apple: {
    name: 'iCloud',
    icon: '🍎',
    color: '#007AFF',
    description: 'Sync your research files with iCloud storage'
  },
  onedrive: {
    name: 'OneDrive',
    icon: '☁️',
    color: '#0078D4',
    description: 'Sync your research files with Microsoft OneDrive'
  }
};

export const CloudSyncSettings: React.FC = () => {
  const {
    connectedServices,
    loading,
    error,
    connectService,
    disconnectService,
    listFiles,
    uploadFile,
    downloadFile,
    isConnected
  } = useCloudSync();

  const [enableSync, setEnableSync] = useState<boolean>(() => {
    return localStorage.getItem('cloud_sync_enabled') === 'true';
  });

  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('cloud_sync_auto') === 'true';
  });

  const [syncInterval, setSyncInterval] = useState<number>(() => {
    return parseInt(localStorage.getItem('cloud_sync_interval') || '30', 10);
  });

  const [selectedFolders, setSelectedFolders] = useState<Record<CloudServiceName, SyncFolderConfig | null>>({
    dropbox: null,
    google: null,
    apple: null,
    onedrive: null
  });

  const [folderSelectorOpen, setFolderSelectorOpen] = useState<CloudServiceName | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState<CloudServiceName | null>(null);

  // Load saved folder configurations
  useEffect(() => {
    const savedFolders = localStorage.getItem('cloud_sync_folders');
    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders);
        setSelectedFolders(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error('Failed to parse saved folder config:', err);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('cloud_sync_enabled', enableSync.toString());
    localStorage.setItem('cloud_sync_auto', autoSync.toString());
    localStorage.setItem('cloud_sync_interval', syncInterval.toString());
  }, [enableSync, autoSync, syncInterval]);

  // Save folder configurations
  useEffect(() => {
    localStorage.setItem('cloud_sync_folders', JSON.stringify(selectedFolders));
  }, [selectedFolders]);

  const handleConnect = async (serviceName: CloudServiceName) => {
    try {
      await connectService(serviceName);
    } catch (err) {
      console.error(`Failed to connect to ${serviceName}:`, err);
    }
  };

  const handleDisconnect = async (serviceName: CloudServiceName) => {
    try {
      await disconnectService(serviceName);
      // Clear folder selection when disconnecting
      setSelectedFolders(prev => ({
        ...prev,
        [serviceName]: null
      }));
      setDisconnectDialogOpen(null);
    } catch (err) {
      console.error(`Failed to disconnect from ${serviceName}:`, err);
    }
  };

  const handleFolderSelect = (serviceName: CloudServiceName) => {
    setFolderSelectorOpen(serviceName);
  };

  const handleFolderSelected = (folder: { id: string; name: string; path: string }) => {
    if (folderSelectorOpen) {
      setSelectedFolders(prev => ({
        ...prev,
        [folderSelectorOpen]: folder
      }));
      setFolderSelectorOpen(null);
    }
  };

  const handleClearFolder = (serviceName: CloudServiceName) => {
    setSelectedFolders(prev => ({
      ...prev,
      [serviceName]: null
    }));
  };

  const getConnectionStatus = (serviceName: CloudServiceName) => {
    if (isConnected(serviceName)) {
      return { status: 'connected', icon: <CheckCircleIcon color="success" />, text: 'Connected' };
    } else if (loading) {
      return { status: 'connecting', icon: <RefreshIcon color="primary" />, text: 'Connecting...' };
    } else {
      return { status: 'disconnected', icon: <ErrorIcon color="error" />, text: 'Disconnected' };
    }
  };

  const getFolderDisplayName = (serviceName: CloudServiceName) => {
    const folder = selectedFolders[serviceName];
    if (!folder) return 'No folder selected';
    return folder.name;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <CloudIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Cloud Sync Settings</Typography>
          </Box>
        }
        subheader="Configure cloud storage synchronization for your research files"
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* General Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            General Settings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={enableSync}
                onChange={(e) => setEnableSync(e.target.checked)}
              />
            }
            label="Enable Cloud Sync"
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                disabled={!enableSync}
              />
            }
            label="Auto-sync files"
          />
          <TextField
            label="Sync Interval (minutes)"
            type="number"
            value={syncInterval}
            onChange={(e) => setSyncInterval(parseInt(e.target.value) || 30)}
            disabled={!enableSync || !autoSync}
            sx={{ mt: 2, width: 200 }}
            inputProps={{ min: 5, max: 1440 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Cloud Services */}
        <Typography variant="subtitle1" gutterBottom>
          Cloud Services
        </Typography>

        <List>
          {Object.entries(serviceConfigs).map(([serviceName, config]) => {
            const serviceKey = serviceName as CloudServiceName;
            const status = getConnectionStatus(serviceKey);
            const isConnected = status.status === 'connected';

            return (
              <ListItem key={serviceName} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      {config.icon}
                    </Typography>
                    <Box>
                      <Typography variant="subtitle1">
                        {config.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {config.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center">
                    {status.icon}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {status.text}
                    </Typography>
                  </Box>
                </Box>

                {/* Connection Controls */}
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center">
                    {isConnected ? (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FolderIcon />}
                          onClick={() => handleFolderSelect(serviceKey)}
                          sx={{ mr: 1 }}
                        >
                          {getFolderDisplayName(serviceKey)}
                        </Button>
                        {selectedFolders[serviceKey] && (
                          <Tooltip title="Clear folder selection">
                            <IconButton
                              size="small"
                              onClick={() => handleClearFolder(serviceKey)}
                            >
                              <DisconnectIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleConnect(serviceKey)}
                        disabled={loading}
                        sx={{ 
                          backgroundColor: config.color,
                          '&:hover': { backgroundColor: config.color }
                        }}
                      >
                        Connect
                      </Button>
                    )}
                  </Box>

                  {isConnected && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => setDisconnectDialogOpen(serviceKey)}
                    >
                      Disconnect
                    </Button>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>

        {/* Folder Selector Dialog */}
        <GoogleDriveFolderSelector
          open={folderSelectorOpen === 'google'}
          onClose={() => setFolderSelectorOpen(null)}
          onFolderSelect={handleFolderSelected}
          currentFolderId={selectedFolders.google?.id}
        />

        {/* Disconnect Confirmation Dialog */}
        <Dialog
          open={disconnectDialogOpen !== null}
          onClose={() => setDisconnectDialogOpen(null)}
        >
          <DialogTitle>Disconnect Service</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to disconnect from {disconnectDialogOpen && serviceConfigs[disconnectDialogOpen]?.name}?
              This will remove all sync configurations and stop file synchronization.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDisconnectDialogOpen(null)}>Cancel</Button>
            <Button
              onClick={() => disconnectDialogOpen && handleDisconnect(disconnectDialogOpen)}
              color="error"
              variant="contained"
            >
              Disconnect
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}; 