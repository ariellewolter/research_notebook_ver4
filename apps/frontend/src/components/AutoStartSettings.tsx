import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Box
} from '@mui/material';
import { getAutoStartStatus, setAutoStart } from '../utils/fileSystemAPI';

interface AutoStartStatus {
    success: boolean;
    openAtLogin: boolean;
    openAsHidden: boolean;
    path?: string;
    error?: string;
}

export default function AutoStartSettings() {
    const [status, setStatus] = useState<AutoStartStatus>({
        success: false,
        openAtLogin: false,
        openAsHidden: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStatus = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await getAutoStartStatus();
            setStatus(result);
            if (!result.success && result.error) {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to load auto-start status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (enabled: boolean) => {
        try {
            setIsUpdating(true);
            setError(null);
            const result = await setAutoStart(enabled);
            if (result.success) {
                setStatus(prev => ({
                    ...prev,
                    openAtLogin: result.enabled,
                    success: true
                }));
            } else {
                setError(result.error || 'Failed to update auto-start setting');
            }
        } catch (err) {
            setError('Failed to update auto-start setting');
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={20} />
                        <Typography>Loading auto-start settings...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Auto-Start on Login
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <FormControlLabel
                    control={
                        <Switch
                            checked={status.openAtLogin}
                            onChange={(e) => handleToggle(e.target.checked)}
                            disabled={isUpdating || !status.success}
                        />
                    }
                    label="Start Research Notebook automatically when you log in"
                />

                {isUpdating && (
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                            Updating...
                        </Typography>
                    </Box>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    When enabled, Research Notebook will start automatically when you log into your computer.
                </Typography>
            </CardContent>
        </Card>
    );
} 