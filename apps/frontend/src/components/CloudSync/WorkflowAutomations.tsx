import React, { useState, useEffect } from 'react';
import { useWorkflowAutomations } from '../../hooks/useWorkflowAutomations';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon,
  FileDownload as ExportIcon,
  Backup as BackupIcon,
  History as HistoryIcon,
  TrendingUp as StatsIcon,
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Beta as BetaIcon,
} from '@mui/icons-material';

export const WorkflowAutomations: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Dialog states
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  const [logFilter, setLogFilter] = useState('all');

  // Use the workflow automations hook
  const {
    automations,
    automationLogs,
    stats,
    settings,
    loading,
    error,
    toggleAutomation,
    updateGlobalSettings,
    clearError,
    getLogsByType,
  } = useWorkflowAutomations();

  // Handle error display
  useEffect(() => {
    if (error) {
      setMessage({ type: 'error', text: error });
      clearError();
    }
  }, [error, clearError]);

  const handleToggleAutomation = async (automationId: string, enabled: boolean) => {
    const result = await toggleAutomation(automationId, enabled);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to toggle automation' });
    }
  };

  const openConfigDialog = (automation: any) => {
    setSelectedAutomation(automation);
    setConfigDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'running':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'running':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case 'auto-sync':
        return <CloudUploadIcon />;
      case 'auto-export':
        return <ExportIcon />;
      case 'auto-backup':
        return <BackupIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  const filteredLogs = logFilter === 'all' 
    ? automationLogs 
    : getLogsByType(logFilter);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h4">Workflow Automations</Typography>
        <Chip 
          icon={<BetaIcon />} 
          label="Beta" 
          color="warning" 
          size="small" 
          variant="outlined"
        />
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats?.totalAutomations || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Automations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success">
                {stats?.activeAutomations || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Automations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info">
                {stats?.successfulExecutions || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Successful Executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error">
                {stats?.failedExecutions || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Failed Executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Automations" />
          <Tab label="Activity Log" />
          <Tab label="Configuration" />
        </Tabs>
      </Paper>

      {/* Automations Tab */}
      {activeTab === 0 && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {automations.map((automation) => (
              <Grid item xs={12} md={6} key={automation.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAutomationIcon(automation.type)}
                        <Typography variant="h6">{automation.name}</Typography>
                      </Box>
                      <Chip
                        label={automation.status}
                        color={getStatusColor(automation.status) as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Frequency: {automation.frequency}
                    </Typography>

                    {automation.lastRun && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Last Run: {formatTime(automation.lastRun)}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={automation.enabled}
                            onChange={(e) => handleToggleAutomation(automation.id, e.target.checked)}
                            disabled={loading}
                          />
                        }
                        label="Enabled"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openConfigDialog(automation)}
                        disabled={loading}
                      >
                        Configure
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Activity Log Tab */}
      {activeTab === 1 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Activity Log</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                label="Filter by Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="auto-sync">Auto-Sync</MenuItem>
                <MenuItem value="auto-export">Auto-Export</MenuItem>
                <MenuItem value="auto-backup">Auto-Backup</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Automation</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatTime(log.timestamp)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAutomationIcon(log.type)}
                        {log.automationName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(log.status)}
                        label={log.status}
                        color={getStatusColor(log.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell>
                      {log.duration ? formatDuration(log.duration) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Configuration Tab */}
      {activeTab === 2 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Global Automation Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notification Settings
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.notifications.enabled}
                        onChange={(e) => updateGlobalSettings({
                          notifications: { ...settings.notifications, enabled: e.target.checked }
                        })}
                      />
                    }
                    label="Enable automation notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.notifications.showSuccess}
                        onChange={(e) => updateGlobalSettings({
                          notifications: { ...settings.notifications, showSuccess: e.target.checked }
                        })}
                      />
                    }
                    label="Show success notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.notifications.showError}
                        onChange={(e) => updateGlobalSettings({
                          notifications: { ...settings.notifications, showError: e.target.checked }
                        })}
                      />
                    }
                    label="Show error notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.notifications.showWarning}
                        onChange={(e) => updateGlobalSettings({
                          notifications: { ...settings.notifications, showWarning: e.target.checked }
                        })}
                      />
                    }
                    label="Show warning notifications"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Settings
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Max Concurrent Automations"
                    type="number"
                    value={settings.performance.maxConcurrent}
                    onChange={(e) => updateGlobalSettings({
                      performance: { ...settings.performance, maxConcurrent: parseInt(e.target.value) }
                    })}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, max: 10 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Retry Attempts"
                    type="number"
                    value={settings.performance.retryAttempts}
                    onChange={(e) => updateGlobalSettings({
                      performance: { ...settings.performance, retryAttempts: parseInt(e.target.value) }
                    })}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, max: 10 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Retry Delay (seconds)"
                    type="number"
                    value={settings.performance.retryDelay}
                    onChange={(e) => updateGlobalSettings({
                      performance: { ...settings.performance, retryDelay: parseInt(e.target.value) }
                    })}
                    inputProps={{ min: 1, max: 60 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Configure {selectedAutomation?.name}
        </DialogTitle>
        <DialogContent>
          {selectedAutomation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Configuration options for {selectedAutomation.name} will be available here.
              </Typography>
              
              <Typography variant="body2" color="textSecondary">
                This feature is currently in development and will provide detailed configuration options
                for each automation type.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 