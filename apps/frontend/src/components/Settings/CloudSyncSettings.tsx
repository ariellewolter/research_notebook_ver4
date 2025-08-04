import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Cloud,
  CloudOff,
  Settings,
  Refresh,
  Delete,
  CheckCircle,
  Error,
  Warning,
  Info
} from '@mui/icons-material';
import { useCloudSync, CloudServiceName } from '../../hooks/useCloudSync';

const serviceConfigs = {
  dropbox: {
    name: 'Dropbox',
    icon: '☁️',
    color: '#0061FE',
    description: 'Sync your research files with Dropbox cloud storage'
  },
  google: {
    name: 'Google Drive',
    icon: '🔍',
    color: '#4285F4',
    description: 'Connect to Google Drive for file synchronization'
  },
  apple: {
    name: 'iCloud',
    icon: '🍎',
    color: '#000000',
    description: 'Sync with iCloud for seamless Apple ecosystem integration'
  },
  onedrive: {
    name: 'OneDrive',
    icon: '☁️',
    color: '#0078D4',
    description: 'Microsoft OneDrive integration for file backup'
  }
};

export const CloudSyncSettings: React.FC = () => {
  const {
    connectedServices,
    isConnected,
    connectService,
    disconnectService,
    getSyncStatus,
    loading,
    error
  } = useCloudSync();

  const [syncEnabled, setSyncEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(30);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [serviceToDisconnect, setServiceToDisconnect] = useState<CloudServiceName | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSyncEnabled = localStorage.getItem('cloud_sync_enabled');
    const savedAutoSync = localStorage.getItem('cloud_sync_auto_sync');
    const savedSyncInterval = localStorage.getItem('cloud_sync_interval');

    if (savedSyncEnabled) setSyncEnabled(savedSyncEnabled === 'true');
    if (savedAutoSync) setAutoSync(savedAutoSync === 'true');
    if (savedSyncInterval) setSyncInterval(parseInt(savedSyncInterval, 10));
  }, []);

  // Save settings to localStorage
  const saveSettings = (key: string, value: any) => {
    localStorage.setItem(key, value.toString());
  };

  const handleSyncToggle = (enabled: boolean) => {
    setSyncEnabled(enabled);
    saveSettings('cloud_sync_enabled', enabled);
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSync(enabled);
    saveSettings('cloud_sync_auto_sync', enabled);
  };

  const handleSyncIntervalChange = (interval: number) => {
    setSyncInterval(interval);
    saveSettings('cloud_sync_interval', interval);
  };

  const handleConnect = async (serviceName: CloudServiceName) => {
    try {
      await connectService(serviceName);
    } catch (err) {
      console.error(`Failed to connect to ${serviceName}:`, err);
    }
  };

  const handleDisconnectClick = (serviceName: CloudServiceName) => {
    setServiceToDisconnect(serviceName);
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectConfirm = () => {
    if (serviceToDisconnect) {
      disconnectService(serviceToDisconnect);
      setDisconnectDialogOpen(false);
      setServiceToDisconnect(null);
    }
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialogOpen(false);
    setServiceToDisconnect(null);
  };

  const getServiceStatus = (serviceName: CloudServiceName) => {
    const connected = isConnected(serviceName);
    const status = getSyncStatus(serviceName);
    
    if (connected) {
      return {
        status: 'connected',
        text: 'Connected',
        icon: <CheckCircle color="success" />,
        color: 'success'
      };
    } else {
      return {
        status: 'disconnected',
        text: 'Not Connected',
        icon: <CloudOff color="disabled" />,
        color: 'default'
      };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Cloud Sync Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* General Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={syncEnabled}
                onChange={(e) => handleSyncToggle(e.target.checked)}
                disabled={loading}
              />
            }
            label="Enable Cloud Sync"
          />
          
          {syncEnabled && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSync}
                    onChange={(e) => handleAutoSyncToggle(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Auto-sync files"
              />
              
              {autoSync && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2">Sync interval:</Typography>
                  <TextField
                    select
                    size="small"
                    value={syncInterval}
                    onChange={(e) => handleSyncIntervalChange(parseInt(e.target.value, 10))}
                    sx={{ minWidth: 120 }}
                  >
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={1440}>Daily</option>
                  </TextField>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Cloud Services */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cloud Services
          </Typography>
          
          <List>
            {(Object.keys(serviceConfigs) as CloudServiceName[]).map((serviceName) => {
              const config = serviceConfigs[serviceName];
              const serviceStatus = getServiceStatus(serviceName);
              const connected = isConnected(serviceName);
              
              return (
                <ListItem key={serviceName} divider>
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem'
                      }}
                    >
                      {config.icon}
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.name}
                        <Chip
                          label={serviceStatus.text}
                          size="small"
                          color={serviceStatus.color as any}
                          icon={serviceStatus.icon}
                        />
                      </Box>
                    }
                    secondary={config.description}
                  />
                  
                  <ListItemSecondaryAction>
                    {connected ? (
                      <IconButton
                        edge="end"
                        onClick={() => handleDisconnectClick(serviceName)}
                        color="error"
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => handleConnect(serviceName)}
                        disabled={loading || !syncEnabled}
                        startIcon={loading ? <CircularProgress size={16} /> : <Cloud />}
                        sx={{ backgroundColor: config.color }}
                      >
                        Connect
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Info color="info" />
            <Typography variant="h6">
              About Cloud Sync
            </Typography>
          </Box>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            Cloud sync allows you to automatically backup and synchronize your research files 
            across multiple cloud storage services. Your files are encrypted and securely 
            transferred using OAuth2 authentication.
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            <strong>Supported file types:</strong> PDF, DOC, XLS, TXT, JSON, CSV, and images
          </Typography>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialogOpen} onClose={handleDisconnectCancel}>
        <DialogTitle>Disconnect Cloud Service</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect from {serviceToDisconnect ? serviceConfigs[serviceToDisconnect].name : ''}?
            This will remove all stored authentication tokens and stop file synchronization.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisconnectCancel}>Cancel</Button>
          <Button onClick={handleDisconnectConfirm} color="error" variant="contained">
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 