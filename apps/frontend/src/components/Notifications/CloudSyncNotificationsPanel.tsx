import React, { useState, useEffect, useCallback } from 'react';
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
    Tabs,
    Tab,
    Button,
    Tooltip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Paper,
    Grid,
    Card,
    CardContent,
    LinearProgress
} from '@mui/material';
import {
    Cloud as CloudIcon,
    Sync as SyncIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Storage as StorageIcon,
    Speed as SpeedIcon,
    Api as ApiIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { notificationService, AutomationEvent } from '../../services/notificationService';

interface CloudSyncNotificationsPanelProps {
    open: boolean;
    onClose: () => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`cloud-sync-tabpanel-${index}`}
            aria-labelledby={`cloud-sync-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    );
}

const CloudSyncNotificationsPanel: React.FC<CloudSyncNotificationsPanelProps> = ({
    open,
    onClose
}) => {
    const [events, setEvents] = useState<AutomationEvent[]>([]);
    const [tabValue, setTabValue] = useState(0);
    const [filterService, setFilterService] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [retryingEvents, setRetryingEvents] = useState<Set<string>>(new Set());

    // Load events when panel opens
    useEffect(() => {
        if (open) {
            loadEvents();
        }
    }, [open]);

    // Subscribe to notification service
    useEffect(() => {
        const unsubscribe = notificationService.subscribe((newEvents) => {
            setEvents(newEvents.filter(event => 
                event.type === 'background_sync' || 
                event.type === 'sync-conflict' || 
                event.type === 'sync-conflict-resolved'
            ));
        });

        return unsubscribe;
    }, []);

    const loadEvents = useCallback(() => {
        const allEvents = notificationService.getEvents();
        const cloudSyncEvents = allEvents.filter(event => 
            event.type === 'background_sync' || 
            event.type === 'sync-conflict' || 
            event.type === 'sync-conflict-resolved'
        );
        setEvents(cloudSyncEvents);
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleMarkAsRead = (eventId: string) => {
        notificationService.markAsRead(eventId);
    };

    const handleMarkAllAsRead = () => {
        notificationService.markAllAsRead();
    };

    const handleClearEvents = () => {
        notificationService.clearEventsByCategory('background_sync');
        notificationService.clearEventsByCategory('sync_conflict');
    };

    const handleRetryEvent = async (event: AutomationEvent) => {
        if (event.retryAction) {
            setRetryingEvents(prev => new Set(prev).add(event.id));
            try {
                await event.retryAction();
            } catch (error) {
                console.error('Retry failed:', error);
            } finally {
                setRetryingEvents(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(event.id);
                    return newSet;
                });
            }
        }
    };

    const handleToggleExpanded = (eventId: string) => {
        setExpandedEvents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };

    const getEventIcon = (event: AutomationEvent) => {
        if (event.type === 'sync-conflict') {
            return <WarningIcon color="warning" />;
        }
        if (event.type === 'sync-conflict-resolved') {
            return <CheckCircleIcon color="success" />;
        }

        const metadata = event.metadata;
        if (metadata?.syncType === 'connection') {
            return <CloudIcon color="primary" />;
        }
        if (metadata?.syncType === 'quota') {
            return <StorageIcon color="warning" />;
        }

        switch (event.status) {
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'pending':
                return <CircularProgress size={20} />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return '#d32f2f';
            case 'high': return '#f57c00';
            case 'normal': return '#1976d2';
            case 'low': return '#388e3c';
            default: return '#757575';
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const getServiceColor = (service: string) => {
        const colors: Record<string, string> = {
            'dropbox': '#0061FE',
            'google': '#4285F4',
            'onedrive': '#0078D4',
            'icloud': '#007AFF'
        };
        return colors[service] || '#757575';
    };

    const getServiceIcon = (service: string) => {
        const icons: Record<string, string> = {
            'dropbox': '☁️',
            'google': '📁',
            'onedrive': '☁️',
            'icloud': '🍎'
        };
        return icons[service] || '☁️';
    };

    // Filter events based on current filters
    const filteredEvents = events.filter(event => {
        const metadata = event.metadata;
        
        if (filterService !== 'all' && metadata?.cloudService !== filterService) {
            return false;
        }
        
        if (filterStatus !== 'all' && event.status !== filterStatus) {
            return false;
        }
        
        if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !event.message.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        
        return true;
    });

    // Get critical alerts (errors and urgent warnings)
    const criticalAlerts = events.filter(event => 
        event.status === 'error' || 
        (event.status === 'warning' && event.priority === 'urgent')
    );

    // Get sync statistics
    const getSyncStats = () => {
        const stats = {
            total: events.length,
            success: events.filter(e => e.status === 'success').length,
            error: events.filter(e => e.status === 'error').length,
            warning: events.filter(e => e.status === 'warning').length,
            pending: events.filter(e => e.status === 'pending').length,
            byService: {} as Record<string, number>,
            conflicts: events.filter(e => e.type === 'sync-conflict').length,
            resolved: events.filter(e => e.type === 'sync-conflict-resolved').length
        };

        events.forEach(event => {
            const service = event.metadata?.cloudService;
            if (service) {
                stats.byService[service] = (stats.byService[service] || 0) + 1;
            }
        });

        return stats;
    };

    const stats = getSyncStats();

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
                sx: { height: '80vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <CloudIcon />
                        <Typography variant="h6">Cloud Sync Notifications</Typography>
                        <Badge badgeContent={events.filter(e => !e.isRead).length} color="primary">
                            <SyncIcon />
                        </Badge>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton onClick={loadEvents} size="small">
                            <RefreshIcon />
                        </IconButton>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Critical Alerts */}
                {criticalAlerts.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Critical Sync Issues ({criticalAlerts.length})
                        </Typography>
                        <Typography variant="body2">
                            There are {criticalAlerts.length} critical sync issues that require attention.
                        </Typography>
                    </Alert>
                )}

                {/* Sync Statistics */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Sync Statistics</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <Typography variant="h4" color="primary">{stats.total}</Typography>
                                <Typography variant="caption">Total Events</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <Typography variant="h4" color="success.main">{stats.success}</Typography>
                                <Typography variant="caption">Successful</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <Typography variant="h4" color="error.main">{stats.error}</Typography>
                                <Typography variant="caption">Errors</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <Typography variant="h4" color="warning.main">{stats.conflicts}</Typography>
                                <Typography variant="caption">Conflicts</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Filters */}
                <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Service</InputLabel>
                                <Select
                                    value={filterService}
                                    onChange={(e) => setFilterService(e.target.value)}
                                    label="Service"
                                >
                                    <MenuItem value="all">All Services</MenuItem>
                                    <MenuItem value="dropbox">Dropbox</MenuItem>
                                    <MenuItem value="google">Google Drive</MenuItem>
                                    <MenuItem value="onedrive">OneDrive</MenuItem>
                                    <MenuItem value="icloud">iCloud</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="success">Success</MenuItem>
                                    <MenuItem value="error">Error</MenuItem>
                                    <MenuItem value="warning">Warning</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label={`All Events (${filteredEvents.length})`} />
                        <Tab label={`Critical Alerts (${criticalAlerts.length})`} />
                        <Tab label="Sync History" />
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                <TabPanel value={tabValue} index={0}>
                    <EventList
                        events={filteredEvents}
                        onMarkAsRead={handleMarkAsRead}
                        onRetry={handleRetryEvent}
                        onToggleExpanded={handleToggleExpanded}
                        expandedEvents={expandedEvents}
                        retryingEvents={retryingEvents}
                        getEventIcon={getEventIcon}
                        getPriorityColor={getPriorityColor}
                        formatDate={formatDate}
                        getServiceColor={getServiceColor}
                        getServiceIcon={getServiceIcon}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <EventList
                        events={criticalAlerts}
                        onMarkAsRead={handleMarkAsRead}
                        onRetry={handleRetryEvent}
                        onToggleExpanded={handleToggleExpanded}
                        expandedEvents={expandedEvents}
                        retryingEvents={retryingEvents}
                        getEventIcon={getEventIcon}
                        getPriorityColor={getPriorityColor}
                        formatDate={formatDate}
                        getServiceColor={getServiceColor}
                        getServiceIcon={getServiceIcon}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>Recent Sync History</Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {events.slice(0, 50).map((event) => (
                            <Paper key={event.id} sx={{ p: 1, mb: 1 }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getEventIcon(event)}
                                    <Box flex={1}>
                                        <Typography variant="body2" fontWeight="bold">
                                            {event.title}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {formatDate(event.timestamp)}
                                        </Typography>
                                    </Box>
                                    {event.metadata?.cloudService && (
                                        <Chip
                                            label={event.metadata.cloudService}
                                            size="small"
                                            sx={{ 
                                                backgroundColor: getServiceColor(event.metadata.cloudService),
                                                color: 'white'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </TabPanel>
            </DialogContent>
        </Dialog>
    );
};

interface EventListProps {
    events: AutomationEvent[];
    onMarkAsRead: (id: string) => void;
    onRetry: (event: AutomationEvent) => void;
    onToggleExpanded: (id: string) => void;
    expandedEvents: Set<string>;
    retryingEvents: Set<string>;
    getEventIcon: (event: AutomationEvent) => React.ReactElement;
    getPriorityColor: (priority: string) => string;
    formatDate: (date: Date) => string;
    getServiceColor: (service: string) => string;
    getServiceIcon: (service: string) => string;
}

const EventList = ({
    events,
    onMarkAsRead,
    onRetry,
    onToggleExpanded,
    expandedEvents,
    retryingEvents,
    getEventIcon,
    getPriorityColor,
    formatDate,
    getServiceColor,
    getServiceIcon
}: EventListProps) => {
    const renderMetadata = (metadata: any) => {
        if (!metadata) return null;

        return (
            <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                {metadata.cloudService && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <span>{getServiceIcon(metadata.cloudService)}</span>
                        <Typography variant="caption">
                            Service: {metadata.cloudService}
                        </Typography>
                    </Box>
                )}
                {metadata.syncType && (
                    <Typography variant="caption" display="block">
                        Type: {metadata.syncType}
                    </Typography>
                )}
                {metadata.entityType && metadata.entityCount && (
                    <Typography variant="caption" display="block">
                        {metadata.entityCount} {metadata.entityType}
                    </Typography>
                )}
                {metadata.duration && (
                    <Typography variant="caption" display="block">
                        Duration: {metadata.duration}ms
                    </Typography>
                )}
                {metadata.percentage && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                            Usage: {metadata.percentage}%
                        </Typography>
                        <LinearProgress 
                            variant="determinate" 
                            value={metadata.percentage} 
                            color={metadata.percentage > 90 ? 'error' : 'primary'}
                        />
                    </Box>
                )}
            </Box>
        );
    };

    if (events.length === 0) {
        return (
            <Box textAlign="center" py={4}>
                <CloudIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                    No cloud sync events
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Cloud sync events will appear here when they occur.
                </Typography>
            </Box>
        );
    }

    return (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {events.map((event) => (
                <ListItem
                    key={event.id}
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: event.isRead ? 'background.paper' : 'action.hover'
                    }}
                >
                    <ListItemIcon>
                        {getEventIcon(event)}
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" fontWeight={event.isRead ? 'normal' : 'bold'}>
                                    {event.title}
                                </Typography>
                                <Chip
                                    label={event.priority}
                                    size="small"
                                    sx={{ 
                                        backgroundColor: getPriorityColor(event.priority),
                                        color: 'white',
                                        fontSize: '0.7rem'
                                    }}
                                />
                                {event.metadata?.cloudService && (
                                    <Chip
                                        label={event.metadata.cloudService}
                                        size="small"
                                        sx={{ 
                                            backgroundColor: getServiceColor(event.metadata.cloudService),
                                            color: 'white'
                                        }}
                                    />
                                )}
                            </Box>
                        }
                        secondary={
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    {event.message}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {formatDate(event.timestamp)}
                                </Typography>
                                {expandedEvents.has(event.id) && renderMetadata(event.metadata)}
                            </Box>
                        }
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                        {event.canRetry && (
                            <Tooltip title="Retry">
                                <IconButton
                                    size="small"
                                    onClick={() => onRetry(event)}
                                    disabled={retryingEvents.has(event.id)}
                                >
                                    {retryingEvents.has(event.id) ? (
                                        <CircularProgress size={16} />
                                    ) : (
                                        <RefreshIcon />
                                    )}
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={expandedEvents.has(event.id) ? 'Show less' : 'Show more'}>
                            <IconButton
                                size="small"
                                onClick={() => onToggleExpanded(event.id)}
                            >
                                {expandedEvents.has(event.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Tooltip>
                        {!event.isRead && (
                            <Tooltip title="Mark as read">
                                <IconButton
                                    size="small"
                                    onClick={() => onMarkAsRead(event.id)}
                                >
                                    <CheckCircleIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};

export default CloudSyncNotificationsPanel; 