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
  Button,
  Grid,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Code as JsonIcon,
  History as HistoryIcon,
  TrendingUp as StatsIcon,
  Clean as CleanIcon,
} from '@mui/icons-material';

interface ExportSchedule {
  id: string;
  name: string;
  enabled: boolean;
  projects: string[];
  formats: string[];
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  cloudFolder: string;
  timezone: string;
  createdAt: number;
}

interface ExportSchedulerSettings {
  enabled: boolean;
  defaultFormats: string[];
  defaultCloudFolder: string;
  maxConcurrentExports: number;
  retryAttempts: number;
  retryDelay: number;
  cleanupOldExports: boolean;
  maxExportAge: number;
  notificationLevel: string;
}

interface ExportHistoryItem {
  id: string;
  lastExport: number;
  duration: number;
  results: any[];
  success: boolean;
}

export const ExportSchedulerSettings: React.FC = () => {
  const [settings, setSettings] = useState<ExportSchedulerSettings | null>(null);
  const [scheduledExports, setScheduledExports] = useState<ExportSchedule[]>([]);
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExport, setEditingExport] = useState<ExportSchedule | null>(null);
  
  // Form states
  const [newExport, setNewExport] = useState({
    name: '',
    projects: [] as string[],
    formats: ['pdf', 'excel'] as string[],
    schedule: {
      frequency: 'daily' as const,
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1
    },
    cloudFolder: '/research-exports',
    timezone: 'UTC'
  });

  // Load initial data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, exportsRes, historyRes] = await Promise.all([
        window.electronAPI.exportScheduler.getSettings(),
        window.electronAPI.exportScheduler.getExports(),
        window.electronAPI.exportScheduler.getHistory(),
      ]);

      if (settingsRes.success) setSettings(settingsRes.data);
      if (exportsRes.success) setScheduledExports(exportsRes.data);
      if (historyRes.success) setHistory(historyRes.data);
    } catch (error) {
      console.error('Error loading export scheduler data:', error);
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const saveSettings = async () => {
    if (!settings) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler.updateSettings(settings);
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

  const controlScheduler = async (action: 'start' | 'stop') => {
    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler[action]();
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

  const addScheduledExport = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler.addExport(newExport);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setAddDialogOpen(false);
        resetNewExport();
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add export schedule' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add export schedule' });
    } finally {
      setLoading(false);
    }
  };

  const updateScheduledExport = async () => {
    if (!editingExport) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler.updateExport(editingExport.id, editingExport);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setEditDialogOpen(false);
        setEditingExport(null);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update export schedule' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update export schedule' });
    } finally {
      setLoading(false);
    }
  };

  const removeScheduledExport = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this export schedule?')) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler.removeExport(id);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove export schedule' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove export schedule' });
    } finally {
      setLoading(false);
    }
  };

  const toggleScheduledExport = async (id: string, enabled: boolean) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler.toggleExport(id, enabled);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to toggle export schedule' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to toggle export schedule' });
    } finally {
      setLoading(false);
    }
  };

  const executeExport = async (id: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler.executeExport(id);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to execute export' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to execute export' });
    } finally {
      setLoading(false);
    }
  };

  const cleanupExports = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.exportScheduler.cleanupExports();
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to cleanup exports' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cleanup exports' });
    } finally {
      setLoading(false);
    }
  };

  const resetNewExport = () => {
    setNewExport({
      name: '',
      projects: [],
      formats: ['pdf', 'excel'],
      schedule: {
        frequency: 'daily',
        time: '09:00',
        dayOfWeek: 1,
        dayOfMonth: 1
      },
      cloudFolder: '/research-exports',
      timezone: 'UTC'
    });
  };

  const openEditDialog = (exportSchedule: ExportSchedule) => {
    setEditingExport({ ...exportSchedule });
    setEditDialogOpen(true);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <PdfIcon />;
      case 'excel':
        return <ExcelIcon />;
      case 'csv':
        return <CsvIcon />;
      case 'json':
        return <JsonIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Export Scheduler Settings
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
                    label="Enable Export Scheduler"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<StartIcon />}
                      onClick={() => controlScheduler('start')}
                      disabled={loading}
                    >
                      Start
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<StopIcon />}
                      onClick={() => controlScheduler('stop')}
                      disabled={loading}
                    >
                      Stop
                    </Button>
                  </Box>
                </Grid>
              </Grid>
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
                    label="Default Cloud Folder"
                    value={settings.defaultCloudFolder}
                    onChange={(e) => handleSettingChange('defaultCloudFolder', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max Concurrent Exports"
                    type="number"
                    value={settings.maxConcurrentExports}
                    onChange={(e) => handleSettingChange('maxConcurrentExports', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
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

        {/* Advanced Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Advanced Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cleanupOldExports}
                        onChange={(e) => handleSettingChange('cleanupOldExports', e.target.checked)}
                      />
                    }
                    label="Cleanup Old Exports"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max Export Age (days)"
                    type="number"
                    value={settings.maxExportAge / (24 * 60 * 60 * 1000)}
                    onChange={(e) => handleSettingChange('maxExportAge', parseInt(e.target.value) * 24 * 60 * 60 * 1000)}
                    inputProps={{ min: 1, max: 365 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Notification Level</InputLabel>
                    <Select
                      value={settings.notificationLevel}
                      onChange={(e) => handleSettingChange('notificationLevel', e.target.value)}
                      label="Notification Level"
                    >
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduled Exports */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Scheduled Exports</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  disabled={loading}
                >
                  Add Export Schedule
                </Button>
              </Box>

              <List>
                {scheduledExports.map((exportSchedule) => (
                  <ListItem key={exportSchedule.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{exportSchedule.name}</Typography>
                          <Chip
                            label={exportSchedule.enabled ? 'Active' : 'Disabled'}
                            size="small"
                            color={exportSchedule.enabled ? 'success' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {exportSchedule.schedule.frequency} at {exportSchedule.schedule.time}
                            {exportSchedule.schedule.frequency === 'weekly' && ` (Day ${exportSchedule.schedule.dayOfWeek})`}
                            {exportSchedule.schedule.frequency === 'monthly' && ` (Day ${exportSchedule.schedule.dayOfMonth})`}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {exportSchedule.formats.map((format) => (
                              <Chip
                                key={format}
                                icon={getFormatIcon(format)}
                                label={format.toUpperCase()}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Cloud: {exportSchedule.cloudFolder}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Execute Now">
                          <IconButton
                            onClick={() => executeExport(exportSchedule.id)}
                            disabled={loading}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => openEditDialog(exportSchedule)}
                            disabled={loading}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Toggle">
                          <IconButton
                            onClick={() => toggleScheduledExport(exportSchedule.id, !exportSchedule.enabled)}
                            disabled={loading}
                          >
                            <Switch size="small" checked={exportSchedule.enabled} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => removeScheduledExport(exportSchedule.id)}
                            disabled={loading}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {scheduledExports.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No scheduled exports" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Export History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Export History</Typography>
                <Button
                  variant="outlined"
                  startIcon={<CleanIcon />}
                  onClick={cleanupExports}
                  disabled={loading}
                >
                  Cleanup Old Exports
                </Button>
              </Box>

              <List dense>
                {history.slice(0, 10).map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">Export {item.id}</Typography>
                          <Chip
                            label={item.success ? 'Success' : 'Failed'}
                            size="small"
                            color={item.success ? 'success' : 'error'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {formatTime(item.lastExport)} • Duration: {formatDuration(item.duration)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {item.results?.length || 0} formats processed
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {history.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No export history" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Export Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Export Schedule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Export Name"
                value={newExport.name}
                onChange={(e) => setNewExport({ ...newExport, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cloud Folder"
                value={newExport.cloudFolder}
                onChange={(e) => setNewExport({ ...newExport, cloudFolder: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={newExport.schedule.frequency}
                  onChange={(e) => setNewExport({
                    ...newExport,
                    schedule: { ...newExport.schedule, frequency: e.target.value as any }
                  })}
                  label="Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={newExport.schedule.time}
                onChange={(e) => setNewExport({
                  ...newExport,
                  schedule: { ...newExport.schedule, time: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {newExport.schedule.frequency === 'weekly' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={newExport.schedule.dayOfWeek}
                    onChange={(e) => setNewExport({
                      ...newExport,
                      schedule: { ...newExport.schedule, dayOfWeek: e.target.value as number }
                    })}
                    label="Day of Week"
                  >
                    <MenuItem value={1}>Monday</MenuItem>
                    <MenuItem value={2}>Tuesday</MenuItem>
                    <MenuItem value={3}>Wednesday</MenuItem>
                    <MenuItem value={4}>Thursday</MenuItem>
                    <MenuItem value={5}>Friday</MenuItem>
                    <MenuItem value={6}>Saturday</MenuItem>
                    <MenuItem value={0}>Sunday</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {newExport.schedule.frequency === 'monthly' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Day of Month"
                  type="number"
                  value={newExport.schedule.dayOfMonth}
                  onChange={(e) => setNewExport({
                    ...newExport,
                    schedule: { ...newExport.schedule, dayOfMonth: parseInt(e.target.value) }
                  })}
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Export Formats
              </Typography>
              <FormGroup row>
                {['pdf', 'excel', 'csv', 'json'].map((format) => (
                  <FormControlLabel
                    key={format}
                    control={
                      <Checkbox
                        checked={newExport.formats.includes(format)}
                        onChange={(e) => {
                          const formats = e.target.checked
                            ? [...newExport.formats, format]
                            : newExport.formats.filter(f => f !== format);
                          setNewExport({ ...newExport, formats });
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFormatIcon(format)}
                        {format.toUpperCase()}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={addScheduledExport}
            variant="contained"
            disabled={loading || !newExport.name}
          >
            Add Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Export Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Export Schedule</DialogTitle>
        <DialogContent>
          {editingExport && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Export Name"
                  value={editingExport.name}
                  onChange={(e) => setEditingExport({ ...editingExport, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cloud Folder"
                  value={editingExport.cloudFolder}
                  onChange={(e) => setEditingExport({ ...editingExport, cloudFolder: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={editingExport.schedule.frequency}
                    onChange={(e) => setEditingExport({
                      ...editingExport,
                      schedule: { ...editingExport.schedule, frequency: e.target.value as any }
                    })}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Time"
                  type="time"
                  value={editingExport.schedule.time}
                  onChange={(e) => setEditingExport({
                    ...editingExport,
                    schedule: { ...editingExport.schedule, time: e.target.value }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {editingExport.schedule.frequency === 'weekly' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={editingExport.schedule.dayOfWeek}
                      onChange={(e) => setEditingExport({
                        ...editingExport,
                        schedule: { ...editingExport.schedule, dayOfWeek: e.target.value as number }
                      })}
                      label="Day of Week"
                    >
                      <MenuItem value={1}>Monday</MenuItem>
                      <MenuItem value={2}>Tuesday</MenuItem>
                      <MenuItem value={3}>Wednesday</MenuItem>
                      <MenuItem value={4}>Thursday</MenuItem>
                      <MenuItem value={5}>Friday</MenuItem>
                      <MenuItem value={6}>Saturday</MenuItem>
                      <MenuItem value={0}>Sunday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {editingExport.schedule.frequency === 'monthly' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Day of Month"
                    type="number"
                    value={editingExport.schedule.dayOfMonth}
                    onChange={(e) => setEditingExport({
                      ...editingExport,
                      schedule: { ...editingExport.schedule, dayOfMonth: parseInt(e.target.value) }
                    })}
                    inputProps={{ min: 1, max: 31 }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Export Formats
                </Typography>
                <FormGroup row>
                  {['pdf', 'excel', 'csv', 'json'].map((format) => (
                    <FormControlLabel
                      key={format}
                      control={
                        <Checkbox
                          checked={editingExport.formats.includes(format)}
                          onChange={(e) => {
                            const formats = e.target.checked
                              ? [...editingExport.formats, format]
                              : editingExport.formats.filter(f => f !== format);
                            setEditingExport({ ...editingExport, formats });
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getFormatIcon(format)}
                          {format.toUpperCase()}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={updateScheduledExport}
            variant="contained"
            disabled={loading || !editingExport?.name}
          >
            Update Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 