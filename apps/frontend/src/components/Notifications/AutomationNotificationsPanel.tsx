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
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    Search as SearchIcon,
    FileDownload as ImportIcon,
    FileUpload as ExportIcon,
    Sync as SyncIcon,
    Folder as FolderIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Retry as RetryIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { notificationService, AutomationEvent } from '../../services/notificationService';

interface AutomationNotificationsPanelProps {
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
            id={`automation-tabpanel-${index}`}
            aria-labelledby={`automation-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    );
}

const AutomationNotificationsPanel: React.FC<AutomationNotificationsPanelProps> = ({
    open,
    onClose
}) => {
    const [events, setEvents] = useState<AutomationEvent[]>([]);
    const [tabValue, setTabValue] = useState(0);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Get initial events first
        setEvents(notificationService.getEvents());
        
        // Subscribe to notification service
        const unsubscribe = notificationService.subscribe((newEvents) => {
            setEvents(newEvents);
        });

        return unsubscribe;
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
        notificationService.clearEvents();
    };

    const handleClearEventsByCategory = (category: string) => {
        if (category === 'all') {
            notificationService.clearEvents();
        } else {
            // Fix Bug 1: Properly type the category parameter
            const validCategory = category as AutomationEvent['category'];
            notificationService.clearEventsByCategory(validCategory);
        }
    };

    const handleRetryEvent = async (event: AutomationEvent) => {
        if (event.retryAction) {
            try {
                await event.retryAction();
                // Optionally show success feedback
                console.log('Retry successful for event:', event.id);
            } catch (error) {
                console.error('Retry failed:', error);
                // Fix Bug 2: Show error to user instead of just logging
                // You could integrate with a notification system here
                alert(`Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };

    const handleToggleExpanded = (eventId: string) => {
        const newExpanded = new Set(expandedEvents);
        if (newExpanded.has(eventId)) {
            newExpanded.delete(eventId);
        } else {
            newExpanded.add(eventId);
        }
        setExpandedEvents(newExpanded);
    };

    const getEventIcon = (event: AutomationEvent) => {
        const baseIcon = (() => {
            switch (event.type) {
                case 'import':
                    return <ImportIcon />;
                case 'export':
                    return <ExportIcon />;
                case 'zotero_sync':
                    return <SyncIcon />;
                case 'file_watcher':
                    return <FolderIcon />;
                case 'background_sync':
                    return <ScheduleIcon />;
                case 'system':
                    return <InfoIcon />;
                default:
                    return <InfoIcon />;
            }
        })();

        const statusColor = (() => {
            switch (event.status) {
                case 'success':
                    return 'success';
                case 'error':
                    return 'error';
                case 'warning':
                    return 'warning';
                case 'pending':
                    return 'info';
                default:
                    return 'default';
            }
        })();

        return React.cloneElement(baseIcon, { color: statusColor });
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

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    const filteredEvents = events.filter(event => {
        // Category filter
        if (filterCategory !== 'all' && event.category !== filterCategory) {
            return false;
        }

        // Status filter
        if (filterStatus !== 'all' && event.status !== filterStatus) {
            return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            // Fix Bug 4: Use proper logical AND for search filtering
            const matchesSearch = 
                event.title.toLowerCase().includes(query) ||
                event.message.toLowerCase().includes(query) ||
                (event.metadata?.fileNames?.some(name => name.toLowerCase().includes(query)) ?? false) ||
                (event.metadata?.source?.toLowerCase().includes(query) ?? false);
            
            return matchesSearch;
        }

        return true;
    });

    const unreadCount = events.filter(e => !e.isRead).length;
    const errorCount = events.filter(e => e.status === 'error').length;
    const pendingCount = events.filter(e => e.status === 'pending').length;

    const categories = [
        { value: 'all', label: 'All Events' },
        { value: 'file_import', label: 'File Imports' },
        { value: 'file_export', label: 'File Exports' },
        { value: 'zotero_sync', label: 'Zotero Sync' },
        { value: 'file_watcher', label: 'File Watcher' },
        { value: 'background_sync', label: 'Background Sync' },
        { value: 'system', label: 'System' },
    ];

    const statuses = [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'success', label: 'Success' },
        { value: 'error', label: 'Error' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Info' },
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: '90vh',
                    minHeight: '600px'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsIcon />
                    <Typography variant="h6">Automation Logs</Typography>
                    {unreadCount > 0 && (
                        <Badge badgeContent={unreadCount} color="error" />
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => setEvents(notificationService.getEvents())} size="small">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllAsRead}
                            variant="outlined"
                        >
                            Mark All Read
                        </Button>
                    )}
                    <Button
                        size="small"
                        onClick={handleClearEvents}
                        variant="outlined"
                        color="error"
                        startIcon={<ClearIcon />}
                    >
                        Clear All
                    </Button>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* Filters */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                label="Category"
                            >
                                {categories.map(category => (
                                    <MenuItem key={category.value} value={category.value}>
                                        {category.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label="Status"
                            >
                                {statuses.map(status => (
                                    <MenuItem key={status.value} value={status.value}>
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
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
                            sx={{ minWidth: 200 }}
                        />
                    </Box>

                    {/* Summary Stats */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip
                            icon={<InfoIcon />}
                            label={`${events.length} Total`}
                            variant="outlined"
                            size="small"
                        />
                        {unreadCount > 0 && (
                            <Chip
                                icon={<NotificationsIcon />}
                                label={`${unreadCount} Unread`}
                                color="primary"
                                size="small"
                            />
                        )}
                        {errorCount > 0 && (
                            <Chip
                                icon={<ErrorIcon />}
                                label={`${errorCount} Errors`}
                                color="error"
                                size="small"
                            />
                        )}
                        {pendingCount > 0 && (
                            <Chip
                                icon={<CircularProgress size={16} />}
                                label={`${pendingCount} Pending`}
                                color="info"
                                size="small"
                            />
                        )}
                    </Box>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="All Events" />
                        <Tab label="Errors" />
                        <Tab label="Pending" />
                        <Tab label="Recent" />
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
                        getEventIcon={getEventIcon}
                        getPriorityColor={getPriorityColor}
                        formatDate={formatDate}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <EventList
                        events={filteredEvents.filter(e => e.status === 'error')}
                        onMarkAsRead={handleMarkAsRead}
                        onRetry={handleRetryEvent}
                        onToggleExpanded={handleToggleExpanded}
                        expandedEvents={expandedEvents}
                        getEventIcon={getEventIcon}
                        getPriorityColor={getPriorityColor}
                        formatDate={formatDate}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <EventList
                        events={filteredEvents.filter(e => e.status === 'pending')}
                        onMarkAsRead={handleMarkAsRead}
                        onRetry={handleRetryEvent}
                        onToggleExpanded={handleToggleExpanded}
                        expandedEvents={expandedEvents}
                        getEventIcon={getEventIcon}
                        getPriorityColor={getPriorityColor}
                        formatDate={formatDate}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <EventList
                        events={filteredEvents.slice(0, 20)} // Show only recent 20 events
                        onMarkAsRead={handleMarkAsRead}
                        onRetry={handleRetryEvent}
                        onToggleExpanded={handleToggleExpanded}
                        expandedEvents={expandedEvents}
                        getEventIcon={getEventIcon}
                        getPriorityColor={getPriorityColor}
                        formatDate={formatDate}
                    />
                </TabPanel>

                {filteredEvents.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            No events found
                        </Typography>
                    </Box>
                )}
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
    getEventIcon: (event: AutomationEvent) => React.ReactElement;
    getPriorityColor: (priority: string) => string;
    formatDate: (date: Date) => string;
}

const EventList: React.FC<EventListProps> = ({
    events,
    onMarkAsRead,
    onRetry,
    onToggleExpanded,
    expandedEvents,
    getEventIcon,
    getPriorityColor,
    formatDate
}) => {
    return (
        <List sx={{ p: 0 }}>
            {events.map((event, index) => (
                <React.Fragment key={event.id}>
                    <ListItem
                        sx={{
                            backgroundColor: event.isRead ? 'transparent' : 'action.hover',
                            '&:hover': {
                                backgroundColor: 'action.selected'
                            },
                            cursor: 'pointer'
                        }}
                        onClick={() => !event.isRead && onMarkAsRead(event.id)}
                    >
                        <ListItemIcon>
                            {getEventIcon(event)}
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: event.isRead ? 'normal' : 'bold'
                                        }}
                                    >
                                        {event.title}
                                    </Typography>
                                    <Chip
                                        label={event.priority}
                                        size="small"
                                        color={getPriorityColor(event.priority) as any}
                                        variant="outlined"
                                    />
                                    {event.canRetry && (
                                        <Tooltip title="Retry">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRetry(event);
                                                }}
                                            >
                                                <RetryIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title={expandedEvents.has(event.id) ? "Collapse" : "Expand"}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleExpanded(event.id);
                                            }}
                                        >
                                            {expandedEvents.has(event.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            }
                            secondary={
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {event.message}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {formatDate(event.timestamp)}
                                    </Typography>
                                </Box>
                            }
                        />
                    </ListItem>

                    {/* Expanded details */}
                    {expandedEvents.has(event.id) && (
                        <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                            <Alert severity={event.status === 'error' ? 'error' : event.status === 'warning' ? 'warning' : 'info'} sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                    {event.message}
                                </Typography>
                            </Alert>
                            
                            {event.metadata && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        <strong>Details:</strong>
                                    </Typography>
                                    {event.metadata.fileCount && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Files: {event.metadata.fileCount}
                                        </Typography>
                                    )}
                                    {event.metadata.fileNames && event.metadata.fileNames.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Files: {event.metadata.fileNames.join(', ')}
                                        </Typography>
                                    )}
                                    {event.metadata.fileTypes && event.metadata.fileTypes.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Types: {event.metadata.fileTypes.join(', ')}
                                        </Typography>
                                    )}
                                    {event.metadata.syncCount && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Synced: {event.metadata.syncCount} items
                                        </Typography>
                                    )}
                                    {event.metadata.duration && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Duration: {event.metadata.duration}ms
                                        </Typography>
                                    )}
                                    {event.metadata.source && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Source: {event.metadata.source}
                                        </Typography>
                                    )}
                                    {event.metadata.target && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Target: {event.metadata.target}
                                        </Typography>
                                    )}
                                    {event.metadata.format && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Format: {event.metadata.format}
                                        </Typography>
                                    )}
                                    {event.metadata.options && event.metadata.options.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Options: {event.metadata.options.join(', ')}
                                        </Typography>
                                    )}
                                    {event.metadata.errorDetails && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                                            Error: {event.metadata.errorDetails}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}

                    {index < events.length - 1 && <Divider />}
                </React.Fragment>
            ))}
        </List>
    );
};

export default AutomationNotificationsPanel; 