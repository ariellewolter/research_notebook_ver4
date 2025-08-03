import React from 'react';
import { Button, Box, Typography, Stack } from '@mui/material';
import { useNotification, useNotificationPermissions } from '@/hooks/useNotification';

/**
 * Example component demonstrating the use of the notification hook
 */
export default function NotificationExample() {
    const {
        notify,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
        notifyWithActions,
        notifyPersistent,
        notifySilent
    } = useNotification();

    const { requestPermission, isSupported, getPermissionStatus } = useNotificationPermissions();

    const handleBasicNotification = async () => {
        const success = await notify('Basic Notification', 'This is a simple notification!');
        console.log('Notification shown:', success);
    };

    const handleSuccessNotification = async () => {
        const result = await notifySuccess('Success!', 'Your action was completed successfully.');
        console.log('Success notification result:', result);
    };

    const handleErrorNotification = async () => {
        const result = await notifyError('Error!', 'Something went wrong. Please try again.');
        console.log('Error notification result:', result);
    };

    const handleWarningNotification = async () => {
        const result = await notifyWarning('Warning!', 'Please review your input before proceeding.');
        console.log('Warning notification result:', result);
    };

    const handleInfoNotification = async () => {
        const result = await notifyInfo('Information', 'Here is some helpful information for you.');
        console.log('Info notification result:', result);
    };

    const handleNotificationWithActions = async () => {
        const result = await notifyWithActions(
            'Action Required',
            'Please choose an action to proceed.',
            [
                { text: 'Accept', onClick: () => console.log('Accepted') },
                { text: 'Decline', onClick: () => console.log('Declined') }
            ]
        );
        console.log('Action notification result:', result);
    };

    const handlePersistentNotification = async () => {
        const result = await notifyPersistent(
            'Important Message',
            'This notification requires your attention and will not disappear automatically.'
        );
        console.log('Persistent notification result:', result);
    };

    const handleSilentNotification = async () => {
        const result = await notifySilent(
            'Silent Notification',
            'This notification was shown without sound.'
        );
        console.log('Silent notification result:', result);
    };

    const handleRequestPermission = async () => {
        const granted = await requestPermission();
        console.log('Permission granted:', granted);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Notification Hook Example
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
                This component demonstrates the use of the notification hook with various notification types.
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Notification Support
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    Supported: {isSupported() ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    Permission Status: {getPermissionStatus()}
                </Typography>
                <Button
                    variant="outlined"
                    onClick={handleRequestPermission}
                    sx={{ mb: 2 }}
                >
                    Request Permission
                </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
                Basic Notifications
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button variant="contained" onClick={handleBasicNotification}>
                    Basic Notification
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSuccessNotification}
                >
                    Success
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleErrorNotification}
                >
                    Error
                </Button>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={handleWarningNotification}
                >
                    Warning
                </Button>
                <Button
                    variant="contained"
                    color="info"
                    onClick={handleInfoNotification}
                >
                    Info
                </Button>
            </Stack>

            <Typography variant="h6" gutterBottom>
                Advanced Notifications
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                    variant="outlined"
                    onClick={handleNotificationWithActions}
                >
                    With Actions
                </Button>
                <Button
                    variant="outlined"
                    onClick={handlePersistentNotification}
                >
                    Persistent
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleSilentNotification}
                >
                    Silent
                </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
                Check the browser console for detailed results of each notification.
            </Typography>
        </Box>
    );
} 