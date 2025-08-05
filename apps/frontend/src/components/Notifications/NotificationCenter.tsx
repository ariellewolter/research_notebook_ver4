import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  Badge,
  Box,
  Chip,
  Divider,
  Button,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Task as TaskIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Sync as SyncIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { notificationsApi } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import { syncReminderService } from '../../services/syncReminderService';

interface Notification {
  id: string;
  type: 'reminder' | 'overdue' | 'due_soon' | 'completed' | 'assigned' | 'commented' | 'time_logged' | 'sync-reminder';
  message: string;
  isRead: boolean;
  scheduledFor: string;
  createdAt: string;
  taskId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: {
    service?: string;
    hoursSinceLastSync?: number;
    reminderType?: 'warning' | 'critical' | 'error';
    errorCount?: number;
    canRetry?: boolean;
  };
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const [syncingServices, setSyncingServices] = useState<Set<string>>(new Set());

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
      case 'due_soon':
        return <ScheduleIcon color="primary" />;
      case 'overdue':
        return <WarningIcon color="error" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'assigned':
      case 'commented':
        return <TaskIcon color="info" />;
      case 'sync-reminder':
        return <SyncIcon color="warning" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const handleSyncNow = async (service: string, notificationId: string) => {
    if (syncingServices.has(service)) return;

    setSyncingServices(prev => new Set(prev).add(service));

    try {
      const success = await syncReminderService.triggerSync(service);
      
      if (success) {
        // Mark notification as read after successful sync
        onMarkAsRead(notificationId);
      }
    } catch (error) {
      console.error(`Failed to sync ${service}:`, error);
    } finally {
      setSyncingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(service);
        return newSet;
      });
    }
  };

  const getSyncButton = (notification: Notification) => {
    if (notification.type !== 'sync-reminder' || !notification.metadata?.service) {
      return null;
    }

    const service = notification.metadata.service;
    const isSyncing = syncingServices.has(service);
    const canRetry = notification.metadata.canRetry !== false;

    if (!canRetry) return null;

    return (
      <Tooltip title={isSyncing ? 'Syncing...' : 'Sync Now'}>
        <Button
          size="small"
          variant="outlined"
          startIcon={isSyncing ? <RefreshIcon /> : <SyncIcon />}
          onClick={() => handleSyncNow(service, notification.id)}
          disabled={isSyncing}
          sx={{ ml: 1, minWidth: 'auto' }}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </Tooltip>
    );
  };

  const getSyncStatusInfo = (notification: Notification) => {
    if (notification.type !== 'sync-reminder' || !notification.metadata) {
      return null;
    }

    const { service, hoursSinceLastSync, reminderType, errorCount } = notification.metadata;
    
    if (!service) return null;

    const serviceName = service === 'cloud' ? 'Cloud Storage' : 
                       service === 'zotero' ? 'Zotero Library' : service;

    let statusText = '';
    if (reminderType === 'error' && errorCount) {
      statusText = `${errorCount} consecutive errors`;
    } else if (hoursSinceLastSync !== undefined) {
      const hours = Math.floor(hoursSinceLastSync);
      statusText = `Last sync: ${hours} hours ago`;
    }

    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {serviceName} • {statusText}
      </Typography>
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          minHeight: '400px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {unreadCount > 0 && (
            <Chip
              label="Mark all read"
              size="small"
              onClick={onMarkAllAsRead}
              color="primary"
              variant="outlined"
            />
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    },
                    cursor: 'pointer',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                  onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.isRead ? 'normal' : 'bold'
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority)}
                            variant="outlined"
                          />
                          {getSyncButton(notification)}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(notification.createdAt)}
                          </Typography>
                          {getSyncStatusInfo(notification)}
                        </Box>
                      }
                    />
                  </Box>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenter; 