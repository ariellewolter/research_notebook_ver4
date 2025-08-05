import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CloudQueue as CloudIcon,
  LibraryBooks as ZoteroIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSyncReminders } from '../../hooks/useSyncReminders';

const SyncStatusOverview: React.FC = () => {
  const {
    getAllStatuses,
    getConfiguredServices,
    getServicesNeedingSync,
    getServicesWithErrors,
    triggerSync,
    formatTimeSinceLastSync,
    isMonitoring
  } = useSyncReminders();

  const allStatuses = getAllStatuses();
  const configuredServices = getConfiguredServices();
  const servicesNeedingSync = getServicesNeedingSync();
  const servicesWithErrors = getServicesWithErrors();

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'cloud':
        return <CloudIcon />;
      case 'zotero':
        return <ZoteroIcon />;
      default:
        return <SyncIcon />;
    }
  };

  const getStatusIcon = (status: any) => {
    if (status.isSyncing) {
      return <RefreshIcon color="primary" />;
    }
    if (status.hasErrors) {
      return <ErrorIcon color="error" />;
    }
    if (!status.lastSyncTime) {
      return <WarningIcon color="warning" />;
    }
    return <CheckCircleIcon color="success" />;
  };

  const getStatusColor = (status: any) => {
    if (status.isSyncing) return 'primary';
    if (status.hasErrors) return 'error';
    if (!status.lastSyncTime) return 'warning';
    return 'success';
  };

  const getStatusText = (status: any) => {
    if (status.isSyncing) return 'Syncing...';
    if (status.hasErrors) return 'Error';
    if (!status.lastSyncTime) return 'Never synced';
    return 'Synced';
  };

  const handleSyncNow = async (service: string) => {
    try {
      await triggerSync(service);
    } catch (error) {
      console.error(`Failed to sync ${service}:`, error);
    }
  };

  const getServiceDisplayName = (service: string) => {
    switch (service) {
      case 'cloud':
        return 'Cloud Storage';
      case 'zotero':
        return 'Zotero Library';
      default:
        return service.charAt(0).toUpperCase() + service.slice(1);
    }
  };

  if (configuredServices.length === 0) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SyncIcon />
              <Typography variant="h6">Sync Status</Typography>
            </Box>
          }
        />
        <CardContent>
          <Alert severity="info">
            No sync services are configured. Configure cloud storage or Zotero sync to see status here.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SyncIcon />
            <Typography variant="h6">Sync Status</Typography>
            {isMonitoring && (
              <Chip
                label="Monitoring Active"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        }
        subheader={`${configuredServices.length} service${configuredServices.length > 1 ? 's' : ''} configured`}
      />
      <CardContent>
        {servicesWithErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {servicesWithErrors.length} service{servicesWithErrors.length > 1 ? 's' : ''} have sync errors
          </Alert>
        )}

        {servicesNeedingSync.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {servicesNeedingSync.length} service{servicesNeedingSync.length > 1 ? 's' : ''} need{servicesNeedingSync.length === 1 ? 's' : ''} sync
          </Alert>
        )}

        <List sx={{ p: 0 }}>
          {configuredServices.map((status, index) => (
            <React.Fragment key={status.service}>
              <ListItem>
                <ListItemIcon>
                  {getServiceIcon(status.service)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {getServiceDisplayName(status.service)}
                      </Typography>
                      <Chip
                        label={getStatusText(status)}
                        size="small"
                        color={getStatusColor(status)}
                        variant="outlined"
                        icon={getStatusIcon(status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Last sync: {formatTimeSinceLastSync(status.lastSyncTime)}
                      {status.hasErrors && (
                        <span style={{ color: '#d32f2f' }}>
                          {' • '}Has errors
                        </span>
                      )}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Sync Now">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SyncIcon />}
                      onClick={() => handleSyncNow(status.service)}
                      disabled={status.isSyncing}
                    >
                      {status.isSyncing ? 'Syncing...' : 'Sync'}
                    </Button>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              {index < configuredServices.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Summary:</strong> {configuredServices.length} configured, {servicesNeedingSync.length} need sync, {servicesWithErrors.length} have errors
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SyncStatusOverview; 