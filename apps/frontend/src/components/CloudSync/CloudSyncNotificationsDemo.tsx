import React from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Grid,
    Chip
} from '@mui/material';
import {
    Cloud as CloudIcon,
    Sync as SyncIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { notificationService } from '../../services/notificationService';

const CloudSyncNotificationsDemo: React.FC = () => {
    const generateDemoEvents = () => {
        // Simulate successful sync
        notificationService.logCloudSync(
            'success',
            'upload',
            'dropbox',
            'note',
            5,
            undefined,
            2500
        );

        // Simulate sync error
        notificationService.logCloudSync(
            'error',
            'download',
            'google',
            'pdf',
            2,
            'Network timeout',
            5000
        );

        // Simulate connection event
        notificationService.logCloudSyncConnection(
            'success',
            'onedrive',
            'connect'
        );

        // Simulate quota warning
        notificationService.logCloudSyncQuota(
            'warning',
            'dropbox',
            'storage',
            850,
            1000,
            85
        );

        // Simulate sync conflict
        notificationService.logSyncConflict(
            'note',
            'Research Notes',
            'dropbox',
            'content',
            {
                entityId: 'note-123',
                detectedAt: new Date().toISOString()
            }
        );

        // Simulate conflict resolution
        notificationService.logSyncConflictResolved(
            'note',
            'Research Notes',
            'dropbox',
            'Kept Local Version',
            {
                entityId: 'note-123',
                resolution: 'keep-local',
                note: 'User chose to keep local version'
            }
        );
    };

    const clearAllEvents = () => {
        notificationService.clearEvents();
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Cloud Sync Notifications Demo
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                This demo generates sample cloud sync events to test the notification system.
            </Typography>

            <Grid container spacing={2}>
                <Grid item>
                    <Button
                        variant="contained"
                        startIcon={<SyncIcon />}
                        onClick={generateDemoEvents}
                    >
                        Generate Demo Events
                    </Button>
                </Grid>
                <Grid item>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={clearAllEvents}
                    >
                        Clear All Events
                    </Button>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Event Types Generated:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip icon={<CheckCircleIcon />} label="Successful Sync" color="success" size="small" />
                    <Chip icon={<WarningIcon />} label="Sync Error" color="error" size="small" />
                    <Chip icon={<CloudIcon />} label="Connection Event" color="primary" size="small" />
                    <Chip icon={<WarningIcon />} label="Quota Warning" color="warning" size="small" />
                    <Chip icon={<WarningIcon />} label="Sync Conflict" color="warning" size="small" />
                    <Chip icon={<CheckCircleIcon />} label="Conflict Resolved" color="success" size="small" />
                </Box>
            </Box>
        </Paper>
    );
};

export default CloudSyncNotificationsDemo; 