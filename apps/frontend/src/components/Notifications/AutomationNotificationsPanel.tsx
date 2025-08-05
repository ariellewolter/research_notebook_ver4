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
    Snackbar,
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
    Refresh as RetryIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Cloud as CloudIcon,
    Storage as StorageIcon,
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
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showError, setShowError] = useState(false);
    const [retryingEvents, setRetryingEvents] = useState<Set<string>>(new Set());

    // Optimized event comparison using memoization
    const areEventsEqual = React.useCallback((events1: AutomationEvent[], events2: AutomationEvent[]): boolean => {
        if (events1.length !== events2.length) return false;
        
        // Quick check for reference equality
        if (events1 === events2) return true;
        
        // Compare only essential properties for performance
        return events1.every((event1, index) => {
            const event2 = events2[index];
            return event1.id === event2.id && 
                   event1.isRead === event2.isRead && 
                   event1.status === event2.status &&
                   event1.timestamp === event2.timestamp;
        });
    }, []);

    useEffect(() => {
        // Get initial events first
        setEvents(notificationService.getEvents());
        
        // Subscribe to notification service
        const unsubscribe = notificationService.subscribe((newEvents) => {
            // Fix Bug 7: Prevent infinite re-renders by comparing events properly
            setEvents(prevEvents => {
                // Only update if the events have actually changed
                if (!areEventsEqual(prevEvents, newEvents)) {
                    return newEvents;
                }
                return prevEvents;
            });
        });

        // Fix Bug 3: Proper cleanup of subscription
        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);

    // Fix Bug 13: Add cleanup for Set objects when component unmounts
    useEffect(() => {
        return () => {
            setExpandedEvents(new Set());
            setRetryingEvents(new Set());
        };
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Fix Bug 12: Add keyboard navigation support
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
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
            // Fix Bug 1: Properly type the category parameter and handle missing method
            const validCategory = category as AutomationEvent['category'];
            try {
                // Check if the method exists before calling it
                if (typeof notificationService.clearEventsByCategory === 'function') {
                    notificationService.clearEventsByCategory(validCategory);
                } else {
                    // Fix Bug 9: Fix inconsistent state management - use notificationService instead of local state
                    // Fallback: filter and clear manually by updating the service
                    const currentEvents = notificationService.getEvents();
                    const filteredEvents = currentEvents.filter(event => event.category !== validCategory);
                    // Clear all events and add back the filtered ones
                    notificationService.clearEvents();
                    filteredEvents.forEach(event => {
                        // Re-add events that don't match the category
                        notificationService.addEvent({
                            type: event.type,
                            category: event.category,
                            title: event.title,
                            message: event.message,
                            status: event.status,
                            priority: event.priority,
                            metadata: event.metadata,
                            canRetry: event.canRetry,
                            retryAction: event.retryAction
                        });
                    });
                }
            } catch (error) {
                console.error('Error clearing events by category:', error);
                setErrorMessage('Failed to clear events by category');
                setShowError(true);
            }
        }
    };

    const handleRetryEvent = async (event: AutomationEvent) => {
        if (event.retryAction) {
            // Fix Bug 10: Add loading state for retry operations
            setRetryingEvents(prev => new Set(prev).add(event.id));
            
            try {
                await event.retryAction();
                // Optionally show success feedback
                console.log('Retry successful for event:', event.id);
            } catch (error) {
                console.error('Retry failed:', error);
                // Fix Bug 2: Show error to user using proper error handling instead of alert
                const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
                setErrorMessage(`Retry failed: ${errorMsg}`);
                setShowError(true);
            } finally {
                // Remove loading state
                setRetryingEvents(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(event.id);
                    return newSet;
                });
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
            // Handle sync conflict events
            if (event.type === 'sync-conflict') {
                return <WarningIcon />;
            }
            if (event.type === 'sync-conflict-resolved') {
                return <CheckCircleIcon />;
            }

            // Handle cloud sync events with specific icons
            if (event.type === 'background_sync') {
                const metadata = event.metadata;
                if (metadata?.syncType === 'connection') {
                    return <CloudIcon />;
                }
                if (metadata?.syncType === 'quota') {
                    return <StorageIcon />;
                }
                return <SyncIcon />;
            }

            switch (event.type) {
                case 'import':
                    return <ImportIcon />;
                case 'export':
                    return <ExportIcon />;
                case 'zotero_sync':
                    return <SyncIcon />;
                case 'file_watcher':
                    return <FolderIcon />;
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
        // Fix Bug 8: Add error handling for date formatting
        try {
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            const now = new Date();
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
            const diffInHours = Math.floor(diffInMinutes / 60);
            const diffInDays = Math.floor(diffInHours / 24);

            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            if (diffInHours < 24) return `${diffInHours}h ago`;
            if (diffInDays < 7) return `${diffInDays}d ago`;
            return date.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
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
            // Fix Bug 4: Use proper logical AND for search filtering - all conditions must be checked
            const matchesSearch = 
                event.title.toLowerCase().includes(query) ||
                event.message.toLowerCase().includes(query) ||
                (event.metadata?.fileNames?.some(name => name.toLowerCase().includes(query)) ?? false) ||
                (event.metadata?.source?.toLowerCase().includes(query) ?? false);
            
            if (!matchesSearch) {
                return false;
            }
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

    // Fix Bug 5: Add error boundary wrapper
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        console.error('AutomationNotificationsPanel error:', error, errorInfo);
        setErrorMessage('An unexpected error occurred. Please try refreshing the page.');
        setShowError(true);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                onKeyDown={handleKeyDown}
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

                        {/* Critical Alerts */}
                        {(() => {
                            const criticalEvents = events.filter(event => 
                                event.status === 'error' || 
                                (event.status === 'warning' && event.priority === 'urgent')
                            );
                            
                            if (criticalEvents.length > 0) {
                                return (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Critical Issues ({criticalEvents.length})
                                        </Typography>
                                        <Typography variant="body2">
                                            {criticalEvents.length} critical issue{criticalEvents.length > 1 ? 's' : ''} require{criticalEvents.length > 1 ? '' : 's'} immediate attention.
                                        </Typography>
                                    </Alert>
                                );
                            }
                            return null;
                        })()}

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
                        <Tabs 
                            value={tabValue} 
                            onChange={handleTabChange}
                            aria-label="automation notification tabs"
                        >
                            <Tab label="All Events" id="automation-tab-0" aria-controls="automation-tabpanel-0" />
                            <Tab label="Errors" id="automation-tab-1" aria-controls="automation-tabpanel-1" />
                            <Tab label="Pending" id="automation-tab-2" aria-controls="automation-tabpanel-2" />
                            <Tab label="Cloud Sync" id="automation-tab-3" aria-controls="automation-tabpanel-3" />
                            <Tab label="Recent" id="automation-tab-4" aria-controls="automation-tabpanel-4" />
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
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <EventList
                            events={filteredEvents.filter(e => e.status === 'error')}
                            onMarkAsRead={handleMarkAsRead}
                            onRetry={handleRetryEvent}
                            onToggleExpanded={handleToggleExpanded}
                            expandedEvents={expandedEvents}
                            retryingEvents={retryingEvents}
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
                            retryingEvents={retryingEvents}
                            getEventIcon={getEventIcon}
                            getPriorityColor={getPriorityColor}
                            formatDate={formatDate}
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={3}>
                        <EventList
                            events={filteredEvents.filter(e => 
                                e.type === 'background_sync' || 
                                e.type === 'sync-conflict' || 
                                e.type === 'sync-conflict-resolved'
                            )}
                            onMarkAsRead={handleMarkAsRead}
                            onRetry={handleRetryEvent}
                            onToggleExpanded={handleToggleExpanded}
                            expandedEvents={expandedEvents}
                            retryingEvents={retryingEvents}
                            getEventIcon={getEventIcon}
                            getPriorityColor={getPriorityColor}
                            formatDate={formatDate}
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={4}>
                        <EventList
                            events={filteredEvents.slice(0, 20)} // Show only recent 20 events
                            onMarkAsRead={handleMarkAsRead}
                            onRetry={handleRetryEvent}
                            onToggleExpanded={handleToggleExpanded}
                            expandedEvents={expandedEvents}
                            retryingEvents={retryingEvents}
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

            {/* Error Snackbar */}
            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={() => setShowError(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setShowError(false)} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </>
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
    formatDate
}: EventListProps) => {
    // Fix Bug 14: Add error handling for metadata display
    const renderMetadata = (metadata: any) => {
        try {
            return (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        <strong>Details:</strong>
                    </Typography>
                    {metadata.fileCount && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Files: {metadata.fileCount}
                        </Typography>
                    )}
                    {metadata.fileNames && Array.isArray(metadata.fileNames) && metadata.fileNames.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Files: {metadata.fileNames.join(', ')}
                        </Typography>
                    )}
                    {metadata.fileTypes && Array.isArray(metadata.fileTypes) && metadata.fileTypes.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Types: {metadata.fileTypes.join(', ')}
                        </Typography>
                    )}
                    {metadata.syncCount && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Synced: {metadata.syncCount} items
                        </Typography>
                    )}
                    {metadata.duration && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Duration: {metadata.duration}ms
                        </Typography>
                    )}
                    {metadata.source && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Source: {metadata.source}
                        </Typography>
                    )}
                    {metadata.target && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Target: {metadata.target}
                        </Typography>
                    )}
                    {metadata.format && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Format: {metadata.format}
                        </Typography>
                    )}
                    {metadata.options && Array.isArray(metadata.options) && metadata.options.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Options: {metadata.options.join(', ')}
                        </Typography>
                    )}
                    {metadata.errorDetails && (
                        <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                            Error: {metadata.errorDetails}
                        </Typography>
                    )}
                    {/* Cloud Sync specific metadata */}
                    {metadata.cloudService && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Service: {metadata.cloudService}
                        </Typography>
                    )}
                    {metadata.syncType && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Sync Type: {metadata.syncType}
                        </Typography>
                    )}
                    {metadata.entityType && metadata.entityCount && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {metadata.entityCount} {metadata.entityType}
                        </Typography>
                    )}
                    {metadata.quotaType && metadata.percentage && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {metadata.quotaType} Usage: {metadata.percentage}%
                        </Typography>
                    )}
                    {metadata.conflictType && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                            Conflict Type: {metadata.conflictType}
                        </Typography>
                    )}
                    {metadata.resolution && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                            Resolution: {metadata.resolution}
                        </Typography>
                    )}
                </Box>
            );
        } catch (error) {
            console.error('Error rendering metadata:', error);
            return (
                <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                    Error displaying metadata
                </Typography>
            );
        }
    };

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
                                        <Tooltip title={retryingEvents.has(event.id) ? "Retrying..." : "Retry"}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    // Fix Bug 15: Fix event handling for disabled buttons
                                                    e.stopPropagation();
                                                    if (!retryingEvents.has(event.id)) {
                                                        onRetry(event);
                                                    }
                                                }}
                                                disabled={retryingEvents.has(event.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (!retryingEvents.has(event.id)) {
                                                            onRetry(event);
                                                        }
                                                    }
                                                }}
                                            >
                                                {retryingEvents.has(event.id) ? (
                                                    <CircularProgress size={16} />
                                                ) : (
                                                    <RetryIcon fontSize="small" />
                                                )}
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
                            
                            {event.metadata && renderMetadata(event.metadata)}
                        </Box>
                    )}

                    {index < events.length - 1 && <Divider />}
                </React.Fragment>
            ))}
        </List>
    );
};

export default AutomationNotificationsPanel; 