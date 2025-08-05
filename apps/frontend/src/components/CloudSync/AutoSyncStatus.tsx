import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Button,
  Tooltip,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  CloudSync as CloudSyncIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAutoSyncContext } from './AutoSyncProvider';
import { EntityType } from '../../hooks/useAutoSync';

interface AutoSyncStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const AutoSyncStatus: React.FC<AutoSyncStatusProps> = ({ 
  showDetails = true, 
  compact = false 
}) => {
  const {
    status,
    syncResults,
    error,
    setEnabled,
    clearResults,
    getRecentResults,
    getFailedSyncs,
  } = useAutoSyncContext();

  const [expanded, setExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const recentResults = getRecentResults(5);
  const failedSyncs = getFailedSyncs();

  const getStatusColor = () => {
    if (error) return 'error';
    if (status.isSyncing) return 'warning';
    if (status.failedSyncs > 0) return 'warning';
    if (status.lastSyncTime) return 'success';
    return 'default';
  };

  const getStatusText = () => {
    if (status.isSyncing) return 'Syncing...';
    if (error) return 'Error';
    if (status.failedSyncs > 0) return `${status.failedSyncs} failed`;
    if (status.lastSyncTime) return 'Last sync: ' + new Date(status.lastSyncTime).toLocaleTimeString();
    return 'No recent syncs';
  };

  const getEntityTypeIcon = (entityType: EntityType) => {
    switch (entityType) {
      case 'note':
        return '📝';
      case 'project':
        return '📁';
      case 'task':
        return '✅';
      default:
        return '📄';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={getStatusText()}>
          <Badge 
            badgeContent={status.pendingSyncs} 
            color="primary"
            invisible={status.pendingSyncs === 0}
          >
            <CloudSyncIcon 
              color={getStatusColor() as any}
              sx={{ fontSize: 20 }}
            />
          </Badge>
        </Tooltip>
        <FormControlLabel
          control={
            <Switch
              checked={status.isEnabled}
              onChange={(e) => setEnabled(e.target.checked)}
              size="small"
            />
          }
          label="Auto-sync"
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
        />
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudSyncIcon color={getStatusColor() as any} />
            <Typography variant="h6">Auto-Sync Status</Typography>
            {status.pendingSyncs > 0 && (
              <Chip 
                label={`${status.pendingSyncs} pending`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={status.isEnabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
              }
              label="Enabled"
            />
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {status.isSyncing && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Processing sync queue...
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            icon={<ScheduleIcon />}
            label={getStatusText()}
            color={getStatusColor() as any}
            variant="outlined"
          />
          {status.lastSyncTime && (
            <Chip
              icon={<StorageIcon />}
              label={`${recentResults.length} recent`}
              variant="outlined"
              onClick={() => setShowResults(!showResults)}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sync Statistics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`${recentResults.length} total`} size="small" />
              <Chip 
                label={`${failedSyncs.length} failed`} 
                size="small" 
                color={failedSyncs.length > 0 ? 'error' : 'default'}
              />
              <Chip 
                label={`${status.pendingSyncs} pending`} 
                size="small" 
                color="primary"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => setShowResults(!showResults)}
                variant="outlined"
              >
                {showResults ? 'Hide' : 'Show'} Recent Results
              </Button>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearResults}
                variant="outlined"
                color="secondary"
              >
                Clear Results
              </Button>
            </Box>

            <Collapse in={showResults}>
              {recentResults.length > 0 ? (
                <List dense>
                  {recentResults.map((result, index) => (
                    <React.Fragment key={`${result.entityId}-${result.timestamp}`}>
                      <ListItem>
                        <ListItemIcon>
                          {result.success ? (
                            <SuccessIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{getEntityTypeIcon(result.entityType)}</span>
                              <span>{result.entityType}</span>
                              <span>•</span>
                              <span>{result.serviceName}</span>
                              {result.retryCount > 0 && (
                                <Chip 
                                  label={`Retry ${result.retryCount}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {result.entityId} • {formatTimestamp(result.timestamp)}
                              </Typography>
                              {result.error && (
                                <Typography variant="body2" color="error">
                                  {result.error}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentResults.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent sync results
                </Typography>
              )}
            </Collapse>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}; 