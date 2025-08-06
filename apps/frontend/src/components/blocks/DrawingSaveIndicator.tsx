import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CloudSync as CloudSyncIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DrawingSyncState } from '../../hooks/useDrawingSync';

interface DrawingSaveIndicatorProps {
  state: DrawingSyncState;
  onRetry?: () => void;
  onDismissError?: () => void;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const DrawingSaveIndicator: React.FC<DrawingSaveIndicatorProps> = ({
  state,
  onRetry,
  onDismissError,
  showDetails = false,
  size = 'medium',
  position = 'top-right'
}) => {
  const {
    isSaving,
    isSyncing,
    syncStatus,
    lastSaved,
    hasUnsavedChanges,
    saveError,
    cloudSynced,
    cloudService
  } = state;

  // Determine the main status
  const getStatusInfo = () => {
    if (isSaving || isSyncing) {
      return {
        icon: <CircularProgress size={16} />,
        label: isSaving ? 'Saving...' : 'Syncing...',
        color: 'primary' as const,
        tooltip: 'Saving drawing data'
      };
    }

    if (saveError) {
      return {
        icon: <ErrorIcon fontSize="small" />,
        label: 'Error',
        color: 'error' as const,
        tooltip: saveError
      };
    }

    if (syncStatus === 'synced') {
      return {
        icon: <CheckIcon fontSize="small" />,
        label: 'Saved',
        color: 'success' as const,
        tooltip: `Last saved: ${lastSaved ? new Date(lastSaved).toLocaleString() : 'Unknown'}`
      };
    }

    if (syncStatus === 'pending') {
      return {
        icon: <SyncIcon fontSize="small" />,
        label: 'Pending',
        color: 'warning' as const,
        tooltip: 'Waiting to sync'
      };
    }

    if (syncStatus === 'offline') {
      return {
        icon: <CloudOffIcon fontSize="small" />,
        label: 'Offline',
        color: 'default' as const,
        tooltip: 'Saved offline, will sync when online'
      };
    }

    if (hasUnsavedChanges) {
      return {
        icon: <WarningIcon fontSize="small" />,
        label: 'Unsaved',
        color: 'warning' as const,
        tooltip: 'Changes not yet saved'
      };
    }

    return {
      icon: <CheckIcon fontSize="small" />,
      label: 'Ready',
      color: 'default' as const,
      tooltip: 'Drawing is ready'
    };
  };

  const statusInfo = getStatusInfo();

  // Get cloud sync indicator
  const getCloudSyncIndicator = () => {
    if (!cloudSynced) return null;

    return (
      <Tooltip title={`Synced to ${cloudService || 'cloud'}`}>
        <CloudSyncIcon fontSize="small" color="success" />
      </Tooltip>
    );
  };

  // Get retry button
  const getRetryButton = () => {
    if (!saveError || !onRetry) return null;

    return (
      <Tooltip title="Retry save">
        <IconButton
          size="small"
          onClick={onRetry}
          sx={{ ml: 0.5, p: 0.5 }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  // Get dismiss button
  const getDismissButton = () => {
    if (!saveError || !onDismissError) return null;

    return (
      <Tooltip title="Dismiss error">
        <IconButton
          size="small"
          onClick={onDismissError}
          sx={{ ml: 0.5, p: 0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  // Position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 8, left: 8 };
      case 'top-right':
        return { top: 8, right: 8 };
      case 'bottom-left':
        return { bottom: 8, left: 8 };
      case 'bottom-right':
        return { bottom: 8, right: 8 };
      default:
        return { top: 8, right: 8 };
    }
  };

  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: '0.75rem', height: 24 };
      case 'large':
        return { fontSize: '1rem', height: 32 };
      default:
        return { fontSize: '0.875rem', height: 28 };
    }
  };

  return (
    <>
      {/* Main Status Indicator */}
      <Box
        sx={{
          position: 'absolute',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          ...getPositionStyles()
        }}
      >
        <Fade in={true} timeout={300}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={statusInfo.tooltip}>
              <Chip
                icon={statusInfo.icon}
                label={statusInfo.label}
                color={statusInfo.color}
                size={size}
                sx={{
                  ...getSizeStyles(),
                  '& .MuiChip-icon': {
                    color: 'inherit'
                  }
                }}
              />
            </Tooltip>
            
            {getCloudSyncIndicator()}
            {getRetryButton()}
            {getDismissButton()}
          </Box>
        </Fade>
      </Box>

      {/* Detailed Status (if enabled) */}
      {showDetails && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            zIndex: 10,
            maxWidth: '80%'
          }}
        >
          <Fade in={true} timeout={500}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {lastSaved && (
                <Chip
                  label={`Last saved: ${new Date(lastSaved).toLocaleTimeString()}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              
              {cloudService && (
                <Chip
                  icon={<CloudSyncIcon />}
                  label={`${cloudService} sync`}
                  size="small"
                  variant="outlined"
                  color={cloudSynced ? 'success' : 'default'}
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Fade>
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!saveError}
        autoHideDuration={6000}
        onClose={onDismissError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={onDismissError}
          severity="error"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {onRetry && (
                <IconButton
                  size="small"
                  onClick={onRetry}
                  sx={{ color: 'inherit' }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              )}
              {onDismissError && (
                <IconButton
                  size="small"
                  onClick={onDismissError}
                  sx={{ color: 'inherit' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          }
        >
          {saveError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DrawingSaveIndicator; 