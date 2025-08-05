import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import {
  Sync as SyncIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { syncReminderService, SyncReminderConfig } from '../../services/syncReminderService';

const SyncReminderSettings: React.FC = () => {
  const [config, setConfig] = useState<SyncReminderConfig>({
    enabled: true,
    checkInterval: 30,
    warningThreshold: 24,
    criticalThreshold: 72,
    errorThreshold: 3
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const currentConfig = syncReminderService.getConfig();
    setConfig(currentConfig);
  };

  const handleConfigChange = (key: keyof SyncReminderConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      syncReminderService.updateConfig(config);
      setMessage({ type: 'success', text: 'Sync reminder settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save sync reminder settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSync = async () => {
    setLoading(true);
    try {
      // Test sync with cloud service
      const success = await syncReminderService.triggerSync('cloud');
      if (success) {
        setMessage({ type: 'success', text: 'Test sync completed successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Test sync failed. Please check your connection.' });
      }
    } catch (error) {
      console.error('Test sync failed:', error);
      setMessage({ type: 'error', text: 'Test sync failed. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${days}d ${remainingHours}h`;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SyncIcon />
            <Typography variant="h6">Sync Reminder Settings</Typography>
          </Box>
        }
        subheader="Configure automatic reminders for sync status"
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

        <FormControlLabel
          control={
            <Switch
              checked={config.enabled}
              onChange={(e) => handleConfigChange('enabled', e.target.checked)}
            />
          }
          label="Enable sync reminders"
          sx={{ mb: 2 }}
        />

        {config.enabled && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Check Interval
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              How often to check sync status: {formatTime(config.checkInterval)}
            </Typography>
            <Slider
              value={config.checkInterval}
              onChange={(_, value) => handleConfigChange('checkInterval', value)}
              min={5}
              max={120}
              step={5}
              marks={[
                { value: 5, label: '5m' },
                { value: 30, label: '30m' },
                { value: 60, label: '1h' },
                { value: 120, label: '2h' }
              ]}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="subtitle2">Warning Threshold</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Send warning after: {formatHours(config.warningThreshold)}
                  </Typography>
                  <TextField
                    type="number"
                    value={config.warningThreshold}
                    onChange={(e) => handleConfigChange('warningThreshold', parseInt(e.target.value) || 24)}
                    inputProps={{ min: 1, max: 168 }}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="subtitle2">Critical Threshold</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Send critical alert after: {formatHours(config.criticalThreshold)}
                  </Typography>
                  <TextField
                    type="number"
                    value={config.criticalThreshold}
                    onChange={(e) => handleConfigChange('criticalThreshold', parseInt(e.target.value) || 72)}
                    inputProps={{ min: 1, max: 720 }}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon color="info" />
                <Typography variant="subtitle2">Error Threshold</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Alert after consecutive sync errors: {config.errorThreshold}
              </Typography>
              <TextField
                type="number"
                value={config.errorThreshold}
                onChange={(e) => handleConfigChange('errorThreshold', parseInt(e.target.value) || 3)}
                inputProps={{ min: 1, max: 10 }}
                size="small"
                sx={{ width: 120 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={<SyncIcon />}
              >
                Save Settings
              </Button>
              <Button
                variant="outlined"
                onClick={handleTestSync}
                disabled={loading}
                startIcon={<SyncIcon />}
              >
                Test Sync
              </Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> Sync reminders will only be sent for configured services (Cloud Storage, Zotero, etc.).
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncReminderSettings; 