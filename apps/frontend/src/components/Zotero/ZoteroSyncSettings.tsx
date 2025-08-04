import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Switch,
    FormControlLabel,
    TextField,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    Sync as SyncIcon,
    Schedule as ScheduleIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { zoteroApi } from '../../services/api';
import { notificationService } from '../../services/notificationService';

interface SyncStatus {
    configured: boolean;
    lastSyncTime: string | null;
    isSyncing: boolean;
    config: {
        userId: string;
        hasGroupId: boolean;
    } | null;
}

interface BackgroundSyncStatus {
    active: boolean;
    intervalMinutes: number | null;
}

interface SyncResult {
    message: string;
    totalItems: number;
    syncedCount: number;
    newItems: Array<{
        key: string;
        title: string;
        type: string;
        authors?: string[];
    }>;
    updatedItems: Array<{
        key: string;
        title: string;
        type: string;
        changes: string[];
    }>;
    errors: string[];
}

const ZoteroSyncSettings: React.FC = () => {
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [backgroundSyncStatus, setBackgroundSyncStatus] = useState<BackgroundSyncStatus | null>(null);
    const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);
    const [backgroundSyncInterval, setBackgroundSyncInterval] = useState(30);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

    useEffect(() => {
        loadSyncStatus();
        loadBackgroundSyncStatus();
    }, []);

    const loadSyncStatus = async () => {
        try {
            setLoading(true);
            const response = await zoteroApi.getSyncStatus();
            setSyncStatus(response.data);
        } catch (error) {
            console.error('Failed to load sync status:', error);
            setMessage({ type: 'error', text: 'Failed to load sync status' });
        } finally {
            setLoading(false);
        }
    };

    const loadBackgroundSyncStatus = async () => {
        try {
            const response = await zoteroApi.getBackgroundSyncStatus();
            const status = response.data;
            setBackgroundSyncStatus(status);
            setBackgroundSyncEnabled(status.active);
            if (status.intervalMinutes) {
                setBackgroundSyncInterval(status.intervalMinutes);
            }
        } catch (error) {
            console.error('Failed to load background sync status:', error);
        }
    };

    const handleManualSync = async () => {
        const startTime = Date.now();
        
        try {
            setSyncing(true);
            setMessage('');

            // Log sync start
            notificationService.logZoteroSync(
                'pending',
                'manual',
                0,
                0,
                0,
                undefined,
                undefined
            );

            const result = await zoteroApi.sync();
            const duration = Date.now() - startTime;

            // Log sync success
            notificationService.logZoteroSync(
                'success',
                'manual',
                result.newItems || 0,
                result.updatedItems || 0,
                result.totalItems || 0,
                undefined,
                duration
            );

            setLastSyncResult(result);
            setMessage(`Sync completed successfully! ${result.newItems || 0} new items, ${result.updatedItems || 0} updated items.`);
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Log sync error
            notificationService.logZoteroSync(
                'error',
                'manual',
                0,
                0,
                0,
                error instanceof Error ? error.message : 'Sync failed',
                duration
            );

            setMessage(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleBackgroundSyncToggle = async () => {
        try {
            setLoading(true);
            setMessage('');

            const newEnabled = !backgroundSyncEnabled;
            
            // Log background sync configuration
            notificationService.logSystemEvent(
                'info',
                'Background Sync Configuration',
                `Background sync ${newEnabled ? 'enabled' : 'disabled'} with ${backgroundSyncInterval} minute interval`
            );

            await zoteroApi.configureBackgroundSync({
                enabled: newEnabled,
                interval: backgroundSyncInterval
            });

            setBackgroundSyncEnabled(newEnabled);
            setMessage(`Background sync ${newEnabled ? 'enabled' : 'disabled'} successfully.`);
        } catch (error) {
            setMessage(`Failed to configure background sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleIntervalChange = async () => {
        try {
            setLoading(true);
            setMessage('');

            // Log interval change
            notificationService.logSystemEvent(
                'info',
                'Background Sync Interval Changed',
                `Background sync interval changed to ${backgroundSyncInterval} minutes`
            );

            await zoteroApi.configureBackgroundSync({
                enabled: backgroundSyncEnabled,
                interval: backgroundSyncInterval
            });

            setMessage(`Background sync interval updated to ${backgroundSyncInterval} minutes.`);
        } catch (error) {
            setMessage(`Failed to update interval: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const formatLastSyncTime = (timestamp: string | null) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleString();
    };

    const getSyncStatusColor = () => {
        if (!syncStatus?.configured) return 'default';
        if (syncStatus.isSyncing) return 'warning';
        if (syncStatus.lastSyncTime) return 'success';
        return 'default';
    };

    const getSyncStatusText = () => {
        if (!syncStatus?.configured) return 'Not Configured';
        if (syncStatus.isSyncing) return 'Syncing...';
        if (syncStatus.lastSyncTime) return 'Last Sync: ' + formatLastSyncTime(syncStatus.lastSyncTime);
        return 'Never Synced';
    };

    if (loading && !syncStatus) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                        Zotero Sync Settings
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            icon={syncStatus?.isSyncing ? <CircularProgress size={16} /> : <SyncIcon />}
                            label={getSyncStatusText()}
                            color={getSyncStatusColor()}
                            size="small"
                        />
                        <Tooltip title="Refresh Status">
                            <IconButton 
                                onClick={loadSyncStatus} 
                                disabled={loading}
                                size="small"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {message && (
                    <Alert 
                        severity={message.type} 
                        sx={{ mb: 2 }}
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                )}

                {/* Manual Sync Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Manual Sync
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Manually trigger a sync to import new items and updates from your Zotero library.
                    </Typography>
                    
                    <Button
                        variant="contained"
                        onClick={handleManualSync}
                        disabled={syncing || !syncStatus?.configured}
                        startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
                        sx={{ mr: 2 }}
                    >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>

                    {lastSyncResult && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Last Sync Results
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <Chip 
                                    icon={<LibraryIcon />} 
                                    label={`${lastSyncResult.totalItems} total items`} 
                                    size="small" 
                                />
                                {lastSyncResult.syncedCount > 0 && (
                                    <Chip 
                                        icon={<CheckCircleIcon />} 
                                        label={`${lastSyncResult.syncedCount} new items`} 
                                        color="success" 
                                        size="small" 
                                    />
                                )}
                                {lastSyncResult.updatedItems.length > 0 && (
                                    <Chip 
                                        icon={<UpdateIcon />} 
                                        label={`${lastSyncResult.updatedItems.length} updated`} 
                                        color="info" 
                                        size="small" 
                                    />
                                )}
                            </Stack>
                            
                            {lastSyncResult.newItems.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        New Items:
                                    </Typography>
                                    <List dense>
                                        {lastSyncResult.newItems.slice(0, 3).map((item, index) => (
                                            <ListItem key={index} sx={{ py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <LibraryIcon fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.title}
                                                    secondary={`${item.type} • ${item.authors?.join(', ') || 'Unknown author'}`}
                                                />
                                            </ListItem>
                                        ))}
                                        {lastSyncResult.newItems.length > 3 && (
                                            <ListItem sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={`... and ${lastSyncResult.newItems.length - 3} more items`}
                                                    sx={{ fontStyle: 'italic' }}
                                                />
                                            </ListItem>
                                        )}
                                    </List>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Background Sync Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Background Sync
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Automatically sync your Zotero library at regular intervals. New items and updates will trigger in-app notifications.
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={backgroundSyncEnabled}
                                onChange={handleBackgroundSyncToggle}
                                disabled={loading || !syncStatus?.configured}
                            />
                        }
                        label="Enable Background Sync"
                        sx={{ mb: 2 }}
                    />

                    {backgroundSyncEnabled && (
                        <Box sx={{ ml: 4, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Sync Interval:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TextField
                                    type="number"
                                    value={backgroundSyncInterval}
                                    onChange={(e) => setBackgroundSyncInterval(Number(e.target.value))}
                                    onBlur={handleIntervalChange}
                                    disabled={loading}
                                    size="small"
                                    sx={{ width: 120 }}
                                    inputProps={{ min: 1, max: 1440 }}
                                />
                                <Typography variant="body2">
                                    minutes
                                </Typography>
                                <Chip
                                    icon={backgroundSyncStatus?.active ? <PlayIcon /> : <StopIcon />}
                                    label={backgroundSyncStatus?.active ? 'Active' : 'Inactive'}
                                    color={backgroundSyncStatus?.active ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Range: 1 minute to 24 hours (1440 minutes)
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Configuration Status */}
                {syncStatus && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Configuration Status
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                icon={syncStatus.configured ? <CheckCircleIcon /> : <ErrorIcon />}
                                label={syncStatus.configured ? 'Configured' : 'Not Configured'}
                                color={syncStatus.configured ? 'success' : 'error'}
                                size="small"
                            />
                            {syncStatus.config && (
                                <Chip
                                    icon={<LibraryIcon />}
                                    label={`User: ${syncStatus.config.userId}`}
                                    size="small"
                                />
                            )}
                            {backgroundSyncStatus?.active && (
                                <Chip
                                    icon={<ScheduleIcon />}
                                    label={`Every ${backgroundSyncStatus.intervalMinutes} min`}
                                    color="info"
                                    size="small"
                                />
                            )}
                        </Stack>
                    </Box>
                )}

                {/* Information */}
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Background Sync Features:</strong>
                    </Typography>
                    <Typography variant="body2" component="div">
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>Automatically syncs new items and updates from Zotero</li>
                            <li>Shows desktop notifications for new items</li>
                            <li>Updates existing items when they change in Zotero</li>
                            <li>Runs in the background without interrupting your work</li>
                        </ul>
                    </Typography>
                </Alert>
            </CardContent>
        </Card>
    );
};

export default ZoteroSyncSettings; 