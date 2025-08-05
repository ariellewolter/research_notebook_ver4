import React from 'react';
import {
  Chip,
  Tooltip,
  Box,
  Typography
} from '@mui/material';
import {
  Cloud as CloudIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  CloudSync as CloudSyncIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

interface CloudSyncStatusBadgeProps {
  cloudSynced: boolean;
  cloudService?: string;
  syncStatus?: string;
  lastSynced?: string;
  size?: 'small' | 'medium';
  showDetails?: boolean;
}

const serviceConfigs = {
  dropbox: {
    name: 'Dropbox',
    color: '#0061FE',
    icon: '☁️'
  },
  google: {
    name: 'Google Drive',
    color: '#4285F4',
    icon: '📁'
  },
  onedrive: {
    name: 'OneDrive',
    color: '#0078D4',
    icon: '☁️'
  },
  icloud: {
    name: 'iCloud',
    color: '#007AFF',
    icon: '🍎'
  }
};

const statusConfigs = {
  pending: {
    label: 'Pending',
    color: 'warning' as const,
    icon: <ScheduleIcon fontSize="small" />
  },
  synced: {
    label: 'Synced',
    color: 'success' as const,
    icon: <CloudDoneIcon fontSize="small" />
  },
  error: {
    label: 'Error',
    color: 'error' as const,
    icon: <ErrorIcon fontSize="small" />
  },
  conflict: {
    label: 'Conflict',
    color: 'warning' as const,
    icon: <WarningIcon fontSize="small" />
  }
};

export const CloudSyncStatusBadge: React.FC<CloudSyncStatusBadgeProps> = ({
  cloudSynced,
  cloudService,
  syncStatus,
  lastSynced,
  size = 'small',
  showDetails = false
}) => {
  if (!cloudSynced) {
    return (
      <Tooltip title="Not synced to cloud">
        <Chip
          icon={<CloudOffIcon />}
          label="Not Synced"
          size={size}
          color="default"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  const serviceConfig = cloudService ? serviceConfigs[cloudService as keyof typeof serviceConfigs] : null;
  const statusConfig = syncStatus ? statusConfigs[syncStatus as keyof typeof statusConfigs] : null;

  const getStatusLabel = () => {
    if (statusConfig) {
      return statusConfig.label;
    }
    return cloudSynced ? 'Synced' : 'Not Synced';
  };

  const getStatusColor = () => {
    if (statusConfig) {
      return statusConfig.color;
    }
    return cloudSynced ? 'success' : 'default';
  };

  const getStatusIcon = () => {
    if (statusConfig) {
      return statusConfig.icon;
    }
    return cloudSynced ? <CloudDoneIcon /> : <CloudOffIcon />;
  };

  const getTooltipText = () => {
    const parts = [];
    
    if (serviceConfig) {
      parts.push(`Service: ${serviceConfig.name}`);
    }
    
    if (lastSynced) {
      parts.push(`Last synced: ${new Date(lastSynced).toLocaleString()}`);
    }
    
    if (syncStatus) {
      parts.push(`Status: ${statusConfig?.label || syncStatus}`);
    }
    
    return parts.length > 0 ? parts.join('\n') : 'Cloud synced';
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={getTooltipText()}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusLabel()}
          size={size}
          color={getStatusColor()}
          variant={cloudSynced ? 'filled' : 'outlined'}
          sx={{
            backgroundColor: serviceConfig?.color,
            color: 'white',
            '& .MuiChip-icon': {
              color: 'white'
            }
          }}
        />
      </Tooltip>
      
      {showDetails && serviceConfig && (
        <Typography variant="caption" color="textSecondary">
          {serviceConfig.icon} {serviceConfig.name}
        </Typography>
      )}
    </Box>
  );
};

export default CloudSyncStatusBadge; 