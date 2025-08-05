import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Box,
  Divider,
  Alert,
  Button,
  Grid,
  Slider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Backup as BackupIcon,
  Settings as SettingsIcon,
  CloudUpload as CloudUploadIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useBackup } from '../../hooks/useBackup';

const BackupSettings: React.FC = () => {
  const {
    config,
    updateConfig,
    createBackup,
    isCreatingBackup,
    isBackupDue,
    formatTimeSinceLastBackup
  } = useBackup();

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleConfigChange = async (key: keyof typeof config, value: any) => {
    try {
      await updateConfig({ [key]: value });
      setMessage({ type: 'success', text: 'Backup settings updated successfully!' });
    } catch (error) {
      console.error('Failed to update backup config:', error);
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    }
  };

  const handleCreateBackup = async () => {
    try {
      const snapshot = await createBackup();
      if (snapshot) {
        setMessage({ type: 'success', text: 'Backup created successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to create backup. Please try again.' });
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      setMessage({ type: 'error', text: 'Failed to create backup. Please try again.' });
    }
  };

  const formatInterval = (days: number) => {
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days === 30) return '1 month';
    return `${Math.floor(days / 30)} months`;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon />
            <Typography variant="h6">Automated Backup Settings</Typography>
          </Box>
        }
        subheader="Configure automatic backup snapshots of your research data"
      />
      <CardContent>
        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {isBackupDue && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Backup is due! Last backup: {formatTimeSinceLastBackup()}
          </Alert>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={config.enabled}
              onChange={(e) => handleConfigChange('enabled', e.target.checked)}
            />
          }
          label="Enable automated backups"
          sx={{ mb: 2 }}
        />

        {config.enabled && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Backup Interval
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Create backups every: {formatInterval(config.interval)}
            </Typography>
            <Slider
              value={config.interval}
              onChange={(_, value) => handleConfigChange('interval', value)}
              min={1}
              max={90}
              step={1}
              marks={[
                { value: 1, label: '1d' },
                { value: 7, label: '1w' },
                { value: 30, label: '1m' },
                { value: 90, label: '3m' }
              ]}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Maximum Backups
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Keep the last {config.maxBackups} backup versions
                  </Typography>
                  <TextField
                    type="number"
                    value={config.maxBackups}
                    onChange={(e) => handleConfigChange('maxBackups', parseInt(e.target.value) || 10)}
                    inputProps={{ min: 1, max: 100 }}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <CloudUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Cloud Folder
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Backup storage location in cloud
                  </Typography>
                  <TextField
                    value={config.cloudFolder}
                    onChange={(e) => handleConfigChange('cloudFolder', e.target.value)}
                    placeholder="/backups"
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Backup Options
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeMetadata}
                        onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
                      />
                    }
                    label="Include metadata"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Include IDs, timestamps, and system metadata
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeRelationships}
                        onChange={(e) => handleConfigChange('includeRelationships', e.target.checked)}
                      />
                    }
                    label="Include relationships"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Include links between projects, notes, and tasks
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.compression}
                        onChange={(e) => handleConfigChange('compression', e.target.checked)}
                      />
                    }
                    label="Enable compression"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Compress backup files to save storage space
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                startIcon={<BackupIcon />}
              >
                {isCreatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
              </Button>
              
              <Tooltip title="Backup will be created automatically based on your interval settings">
                <Button
                  variant="outlined"
                  disabled
                  startIcon={<ScheduleIcon />}
                >
                  Next Auto Backup: {formatTimeSinceLastBackup()}
                </Button>
              </Tooltip>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> Backups are automatically uploaded to your configured cloud storage. 
                Make sure your cloud sync is properly configured.
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupSettings; 