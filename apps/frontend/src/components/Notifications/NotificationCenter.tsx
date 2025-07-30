import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  NotificationsOff,
  CheckCircle,
  Warning,
  Info,
  Error,
  Delete,
  MarkEmailRead,
  Schedule,
  FilterList,
  Settings,
  Close,
  Refresh
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays, addHours } from 'date-fns';
import { notificationsApi } from '../../services/api';

interface Notification {
  id: string;
  taskId: string;
  type: 'reminder' | 'overdue' | 'due_soon' | 'completed' | 'assigned' | 'commented' | 'time_logged';
  message: string;
  scheduledFor: string;
  sentAt?: string;
  isRead: boolean;
  deliveryMethod: 'in_app' | 'email' | 'push' | 'sms';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: string;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
  };
}

interface NotificationStats {
  total: number;
  unread: number;
  overdue: number;
  dueSoon: number;
  highPriority: number;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filter, setFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notificationsRes, statsRes] = await Promise.all([
        notificationsApi.getAll({ unreadOnly, type: filter === 'all' ? undefined : filter }),
        notificationsApi.getStats()
      ]);
      setNotifications(notificationsRes.data.notifications || notificationsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setSnackbar({ open: true, message: 'Failed to load notifications', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Set up polling for new notifications
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [filter, unreadOnly]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      loadNotifications(); // Refresh stats
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setSnackbar({ open: true, message: 'Failed to mark notification as read', severity: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      loadNotifications(); // Refresh stats
      setSnackbar({ open: true, message: 'All notifications marked as read', severity: 'success' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setSnackbar({ open: true, message: 'Failed to mark all notifications as read', severity: 'error' });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      loadNotifications(); // Refresh stats
      setSnackbar({ open: true, message: 'Notification deleted', severity: 'success' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setSnackbar({ open: true, message: 'Failed to delete notification', severity: 'error' });
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const color = priority === 'urgent' ? 'error' : 
                  priority === 'high' ? 'warning' : 
                  'info';
    
    switch (type) {
      case 'overdue':
        return <Error color={color as any} />;
      case 'due_soon':
        return <Warning color={color as any} />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'reminder':
        return <Schedule color={color as any} />;
      default:
        return <Info color={color as any} />;
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

  const filteredNotifications = notifications.filter(n => {
    if (selectedTab === 0) return true; // All
    if (selectedTab === 1) return !n.isRead; // Unread
    if (selectedTab === 2) return n.priority === 'high' || n.priority === 'urgent'; // High Priority
    if (selectedTab === 3) return n.type === 'overdue'; // Overdue
    return true;
  });

  const unreadCount = stats?.unread || 0;

  return (
    <>
      {/* Notification Bell */}
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={() => setDrawerOpen(true)}
          sx={{ position: 'relative' }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActive /> : <NotificationsIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 400, maxWidth: '90vw' }
        }}
      >
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Notifications
            </Typography>
            <IconButton color="inherit" onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2 }}>
          {/* Stats Cards */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h4" color="error">
                      {stats.unread}
                    </Typography>
                    <Typography variant="caption">Unread</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h4" color="warning.main">
                      {stats.overdue}
                    </Typography>
                    <Typography variant="caption">Overdue</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="All" />
            <Tab label="Unread" />
            <Tab label="High Priority" />
            <Tab label="Overdue" />
          </Tabs>

          {/* Filters */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Type</InputLabel>
                  <Select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    label="Filter by Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="reminder">Reminders</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="due_soon">Due Soon</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="commented">Comments</MenuItem>
                    <MenuItem value="time_logged">Time Logged</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={unreadOnly}
                      onChange={(e) => setUnreadOnly(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Unread Only"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Actions */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={loadNotifications}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {/* Notifications List */}
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No notifications"
                  secondary="You're all caught up!"
                />
              </ListItem>
            ) : (
              filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                      borderLeft: `4px solid ${
                        notification.priority === 'urgent' ? 'error.main' :
                        notification.priority === 'high' ? 'warning.main' :
                        'primary.main'
                      }`
                    }}
                  >
                    <Box sx={{ mr: 2 }}>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                            {notification.message}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(notification.scheduledFor), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                          {notification.task && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Task: {notification.task.title}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!notification.isRead && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteNotification(notification.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationCenter; 