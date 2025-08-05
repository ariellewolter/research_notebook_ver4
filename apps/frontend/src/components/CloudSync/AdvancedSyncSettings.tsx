import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  Grid,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Queue as QueueIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  TrendingUp as StatsIcon,
  History as HistoryIcon,
  Delete as ClearIcon,
} from '@mui/icons-material';

interface SyncSchedulerSettings {
  enabled: boolean;
  maxConcurrentSyncs: number;
  largeFileThreshold: number;
  offPeakHours: {
    start: number;
    end: number;
  };
  priorityWeights: {
    recentlyEdited: number;
    smallFiles: number;
    mediumFiles: number;
    largeFiles: number;
  };
  retryAttempts: number;
  retryDelay: number;
  maxQueueSize: number;
}

interface SyncSchedulerStats {
  totalSynced: number;
  totalFailed: number;
  averageSyncTime: number;
  lastSyncTime: number | null;
  queueSize: number;
  isRunning: boolean;
  isActive: boolean;
  isOffPeak: boolean;
  currentFrequency: number;
}

interface SyncQueueItem {
  filePath: string;
  priority: number;
  addedAt: number;
  retryCount: number;
}

interface SyncHistoryItem {
  filePath: string;
  lastSync: number;
  success: boolean;
  syncTime?: number;
  error?: string;
}

export const AdvancedSyncSettings: React.FC = () => {
  const [settings, setSettings] = useState<SyncSchedulerSettings | null>(null);
  const [stats, setStats] = useState<SyncSchedulerStats | null>(null);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, statsRes, queueRes, historyRes] = await Promise.all([
        window.electronAPI.syncScheduler.getSettings(),
        window.electronAPI.syncScheduler.getStats(),
        window.electronAPI.syncScheduler.getQueue(),
        window.electronAPI.syncScheduler.getHistory(),
      ]);

      if (settingsRes.success) setSettings(settingsRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (queueRes.success) setQueue(queueRes.data.items || []);
      if (historyRes.success) setHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error loading sync scheduler data:', error);
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    
    // Handle nested object updates
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      newSettings[parent] = { ...newSettings[parent], [child]: value };
    } else {
      newSettings[key] = value;
    }

    setSettings(newSettings);
  };

  const saveSettings = async () => {
    if (!settings) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.syncScheduler.updateSettings(settings);
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const controlScheduler = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    setLoading(true);
    try {
      const result = await window.electronAPI.syncScheduler[action]();
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || `Failed to ${action} scheduler` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to ${action} scheduler` });
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.syncScheduler.clearQueue();
      if (result.success) {
        setMessage({ type: 'success', text: 'Queue cleared successfully' });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to clear queue' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear queue' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!settings || !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Advanced Sync Settings
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Scheduler Control */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Scheduler Control</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadData}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={saveSettings}
                    disabled={loading}
                  >
                    Save Settings
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enabled}
                        onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                      />
                    }
                    label="Enable Smart Sync Scheduler"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<StartIcon />}
                      onClick={() => controlScheduler('start')}
                      disabled={loading || stats.isRunning}
                    >
                      Start
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<StopIcon />}
                      onClick={() => controlScheduler('stop')}
                      disabled={loading || !stats.isRunning}
                    >
                      Stop
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PauseIcon />}
                      onClick={() => controlScheduler('pause')}
                      disabled={loading || !stats.isRunning}
                    >
                      Pause
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* Status Indicators */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip
                  label={`Status: ${stats.isRunning ? 'Running' : 'Stopped'}`}
                  color={stats.isRunning ? 'success' : 'default'}
                />
                <Chip
                  label={`Queue: ${stats.queueSize}`}
                  color="primary"
                />
                <Chip
                  label={`Activity: ${stats.isActive ? 'Active' : 'Idle'}`}
                  color={stats.isActive ? 'warning' : 'default'}
                />
                <Chip
                  label={`Off-peak: ${stats.isOffPeak ? 'Yes' : 'No'}`}
                  color={stats.isOffPeak ? 'info' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Basic Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max Concurrent Syncs"
                    type="number"
                    value={settings.maxConcurrentSyncs}
                    onChange={(e) => handleSettingChange('maxConcurrentSyncs', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Large File Threshold"
                    type="number"
                    value={settings.largeFileThreshold / (1024 * 1024)}
                    onChange={(e) => handleSettingChange('largeFileThreshold', parseInt(e.target.value) * 1024 * 1024)}
                    inputProps={{ min: 1, max: 1000 }}
                    helperText="MB"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max Queue Size"
                    type="number"
                    value={settings.maxQueueSize}
                    onChange={(e) => handleSettingChange('maxQueueSize', parseInt(e.target.value))}
                    inputProps={{ min: 100, max: 10000 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Weights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Priority Weights
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography gutterBottom>Recently Edited Files</Typography>
                  <Slider
                    value={settings.priorityWeights.recentlyEdited}
                    onChange={(_, value) => handleSettingChange('priorityWeights.recentlyEdited', value)}
                    min={1}
                    max={20}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>Small Files (&lt; 1MB)</Typography>
                  <Slider
                    value={settings.priorityWeights.smallFiles}
                    onChange={(_, value) => handleSettingChange('priorityWeights.smallFiles', value)}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>Medium Files (1MB - 10MB)</Typography>
                  <Slider
                    value={settings.priorityWeights.mediumFiles}
                    onChange={(_, value) => handleSettingChange('priorityWeights.mediumFiles', value)}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>Large Files (&gt; 10MB)</Typography>
                  <Slider
                    value={settings.priorityWeights.largeFiles}
                    onChange={(_, value) => handleSettingChange('priorityWeights.largeFiles', value)}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Off-Peak Hours */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Off-Peak Hours
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Start Hour</InputLabel>
                    <Select
                      value={settings.offPeakHours.start}
                      onChange={(e) => handleSettingChange('offPeakHours.start', e.target.value)}
                      label="Start Hour"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <MenuItem key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>End Hour</InputLabel>
                    <Select
                      value={settings.offPeakHours.end}
                      onChange={(e) => handleSettingChange('offPeakHours.end', e.target.value)}
                      label="End Hour"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <MenuItem key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Retry Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Retry Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Retry Attempts"
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Retry Delay (ms)"
                    type="number"
                    value={settings.retryDelay}
                    onChange={(e) => handleSettingChange('retryDelay', parseInt(e.target.value))}
                    inputProps={{ min: 1000, max: 30000 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="h4" color="primary">
                    {stats.totalSynced}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Synced
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" color="error">
                    {stats.totalFailed}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Failed
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" color="info">
                    {formatDuration(stats.averageSyncTime)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Sync Time
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" color="success">
                    {formatDuration(stats.currentFrequency)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Current Frequency
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sync Queue */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Sync Queue</Typography>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearQueue}
                  disabled={loading || queue.length === 0}
                >
                  Clear Queue
                </Button>
              </Box>

              <List dense>
                {queue.slice(0, 10).map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.filePath.split('/').pop() || item.filePath}
                      secondary={`Priority: ${item.priority} • Added: ${formatTime(item.addedAt)}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={`Retry: ${item.retryCount}`}
                        size="small"
                        color={item.retryCount > 0 ? 'warning' : 'default'}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {queue.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Queue is empty" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sync History */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Sync History
              </Typography>

              <List dense>
                {history.slice(0, 10).map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.filePath.split('/').pop() || item.filePath}
                      secondary={`${formatTime(item.lastSync)} • ${item.success ? 'Success' : 'Failed'}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={item.success ? 'Success' : 'Failed'}
                        size="small"
                        color={item.success ? 'success' : 'error'}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {history.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No sync history" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 