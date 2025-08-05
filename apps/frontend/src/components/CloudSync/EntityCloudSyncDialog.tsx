import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useCloudSync } from '../../hooks/useCloudSync';
import CloudSyncStatusBadge from './CloudSyncStatusBadge';

interface EntityCloudSyncDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: EntityCloudSyncSettings) => void;
  entity: {
    id: string;
    title: string;
    type: 'note' | 'project' | 'pdf';
    cloudSynced?: boolean;
    cloudPath?: string;
    cloudService?: string;
    lastSynced?: string;
    syncStatus?: string;
  };
}

export interface EntityCloudSyncSettings {
  cloudSynced: boolean;
  cloudPath?: string;
  cloudService?: string;
}

const serviceOptions = [
  { value: 'dropbox', label: 'Dropbox', icon: '☁️' },
  { value: 'google', label: 'Google Drive', icon: '📁' },
  { value: 'onedrive', label: 'OneDrive', icon: '☁️' },
  { value: 'icloud', label: 'iCloud', icon: '🍎' }
];

export const EntityCloudSyncDialog: React.FC<EntityCloudSyncDialogProps> = ({
  open,
  onClose,
  onSave,
  entity
}) => {
  const { isConnected, connectedServices } = useCloudSync();
  const [settings, setSettings] = useState<EntityCloudSyncSettings>({
    cloudSynced: entity.cloudSynced || false,
    cloudPath: entity.cloudPath || '',
    cloudService: entity.cloudService || ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings({
      cloudSynced: entity.cloudSynced || false,
      cloudPath: entity.cloudPath || '',
      cloudService: entity.cloudService || ''
    });
  }, [entity]);

  const handleCloudSyncToggle = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      cloudSynced: enabled,
      cloudService: enabled && !prev.cloudService ? connectedServices[0] : prev.cloudService
    }));
  };

  const handleServiceChange = (service: string) => {
    setSettings(prev => ({
      ...prev,
      cloudService: service,
      cloudPath: prev.cloudPath || `/${entity.title}`
    }));
  };

  const handlePathChange = (path: string) => {
    setSettings(prev => ({
      ...prev,
      cloudPath: path
    }));
  };

  const handleSave = () => {
    if (settings.cloudSynced && !settings.cloudService) {
      setError('Please select a cloud service');
      return;
    }

    if (settings.cloudSynced && !settings.cloudPath) {
      setError('Please specify a cloud path');
      return;
    }

    if (settings.cloudSynced && !isConnected(settings.cloudService as any)) {
      setError(`Please connect to ${settings.cloudService} first`);
      return;
    }

    setError(null);
    onSave(settings);
    onClose();
  };

  const getDefaultPath = () => {
    if (!settings.cloudService) return '';
    
    const serviceName = serviceOptions.find(s => s.value === settings.cloudService)?.label || '';
    return `/${serviceName}/${entity.title}`;
  };

  const availableServices = serviceOptions.filter(service => 
    isConnected(service.value as any)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudIcon />
          <Typography variant="h6">
            Cloud Sync Settings - {entity.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current Status
          </Typography>
          <CloudSyncStatusBadge
            cloudSynced={entity.cloudSynced || false}
            cloudService={entity.cloudService}
            syncStatus={entity.syncStatus}
            lastSynced={entity.lastSynced}
            showDetails={true}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Cloud Sync Toggle */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.cloudSynced}
                onChange={(e) => handleCloudSyncToggle(e.target.checked)}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <CloudIcon />
                <Typography>Enable Cloud Sync</Typography>
              </Box>
            }
          />
        </Box>

        {settings.cloudSynced && (
          <>
            {/* Cloud Service Selection */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Cloud Service</InputLabel>
                <Select
                  value={settings.cloudService || ''}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  label="Cloud Service"
                >
                  {availableServices.map((service) => (
                    <MenuItem key={service.value} value={service.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{service.icon}</span>
                        <span>{service.label}</span>
                        <Chip 
                          label="Connected" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                  {availableServices.length === 0 && (
                    <MenuItem disabled>
                      No cloud services connected. Please connect a service in Settings.
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* Cloud Path */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Cloud Path"
                value={settings.cloudPath || getDefaultPath()}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder="e.g., /My Research/Project Notes"
                helperText="Path where this item will be stored in your cloud service"
                InputProps={{
                  startAdornment: <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            {/* Sync Information */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>How it works:</strong> When enabled, this {entity.type} will be automatically 
                synced to your selected cloud service. Changes made locally will be uploaded to the cloud, 
                and changes made in the cloud will be downloaded to your local workspace.
              </Typography>
            </Alert>
          </>
        )}

        {!settings.cloudSynced && (
          <Alert severity="info">
            <Typography variant="body2">
              Enable cloud sync to automatically backup and synchronize this {entity.type} 
              across your connected cloud services.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SettingsIcon />}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EntityCloudSyncDialog; 