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
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Task as TaskIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { notificationsApi } from '../../services/api';

interface Notification {
  id: string;
  type: 'reminder' | 'overdue' | 'due_soon' | 'completed' | 'assigned' | 'commented' | 'time_logged';
  message: string;
  isRead: boolean;
  scheduledFor: string;
  createdAt: string;
  taskId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
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
                    cursor: 'pointer'
                  }}
                  onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                    }
                  />
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