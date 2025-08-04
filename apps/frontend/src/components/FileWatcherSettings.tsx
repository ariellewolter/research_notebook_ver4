import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    Button,
    Chip,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { notificationService } from '../services/notificationService';

interface FileWatcherStatus {
    enabled: boolean;
    folderPath: string | null;
    isWatching: boolean;
}

interface SupportedFileType {
    extension: string;
    name: string;
    mimeType: string;
}

const FileWatcherSettings: React.FC = () => {
    const [status, setStatus] = useState<FileWatcherStatus>({
        enabled: false,
        folderPath: null,
        isWatching: false
    });
    const [supportedTypes, setSupportedTypes] = useState<SupportedFileType[]>([]);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Check if running in Electron
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

    useEffect(() => {
        if (isElectron) {
            loadFileWatcherStatus();
            loadSupportedFileTypes();
        }
    }, [isElectron]);

    const loadFileWatcherStatus = async () => {
        try {
            setLoading(true);
            const result = await (window as any).electronAPI.getFileWatcherStatus();
            if (result.success) {
                setStatus(result);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to load file watcher status' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load file watcher status' });
        } finally {
            setLoading(false);
        }
    };

    const loadSupportedFileTypes = async () => {
        try {
            const result = await (window as any).electronAPI.getSupportedFileTypes();
            if (result.success) {
                setSupportedTypes(result.supportedTypes);
            }
        } catch (error) {
            console.warn('Failed to load supported file types:', error);
        }
    };

    const handleToggleEnabled = async () => {
        try {
            setLoading(true);
            setMessage('');

            const newEnabled = !status.enabled;

            // Log file watcher toggle
            notificationService.logSystemEvent(
                'info',
                'File Watcher Configuration',
                `File watcher ${newEnabled ? 'enabled' : 'disabled'}${status.folderPath ? ` for folder: ${status.folderPath}` : ''}`
            );

            await (window as any).electronAPI.setFileWatcherEnabled(newEnabled);
            setStatus(prev => ({ ...prev, enabled: newEnabled }));
            setMessage(`File watcher ${newEnabled ? 'enabled' : 'disabled'} successfully.`);
        } catch (error) {
            setMessage(`Failed to ${status.enabled ? 'disable' : 'enable'} file watcher: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFolder = async () => {
        try {
            setLoading(true);
            setMessage('');

            const result = await (window as any).electronAPI.selectFileWatcherFolder();
            if (result.success && result.folderPath) {
                // Log folder selection
                notificationService.logSystemEvent(
                    'info',
                    'File Watcher Folder Selected',
                    `File watcher folder changed to: ${result.folderPath}`
                );

                setStatus(prev => ({ ...prev, folderPath: result.folderPath }));
                setMessage(`File watcher folder set to: ${result.folderPath}`);
            }
        } catch (error) {
            setMessage(`Failed to select folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFolder = async () => {
        try {
            setLoading(true);
            setMessage('');

            // Log folder clearing
            notificationService.logSystemEvent(
                'info',
                'File Watcher Folder Cleared',
                'File watcher folder cleared'
            );

            await (window as any).electronAPI.setFileWatcherFolder('');
            setStatus(prev => ({ ...prev, folderPath: '' }));
            setMessage('File watcher folder cleared.');
        } catch (error) {
            setMessage(`Failed to clear folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestWatcher = async () => {
        try {
            setTesting(true);
            setMessage('');

            // Log test start
            notificationService.logFileWatcher(
                'pending',
                'created',
                'test-file.txt',
                'text',
                status.folderPath || 'unknown',
                undefined
            );

            const result = await (window as any).electronAPI.testFileWatcher();
            
            if (result.success) {
                // Log test success
                notificationService.logFileWatcher(
                    'success',
                    'created',
                    'test-file.txt',
                    'text',
                    status.folderPath || 'unknown',
                    undefined
                );

                setMessage('File watcher test completed successfully!');
            } else {
                // Log test error
                notificationService.logFileWatcher(
                    'error',
                    'created',
                    'test-file.txt',
                    'text',
                    status.folderPath || 'unknown',
                    result.error || 'Test failed'
                );

                setMessage(`File watcher test failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            // Log test error
            notificationService.logFileWatcher(
                'error',
                'created',
                'test-file.txt',
                'text',
                status.folderPath || 'unknown',
                error instanceof Error ? error.message : 'Test failed'
            );

            setMessage(`File watcher test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setTesting(false);
        }
    };

    const getFileTypeIcon = (extension: string) => {
        switch (extension) {
            case '.pdf': return <FolderOpenIcon />;
            case '.csv': return <FolderOpenIcon />;
            case '.json': return <FolderOpenIcon />;
            case '.txt':
            case '.md': return <FolderOpenIcon />;
            case '.xlsx':
            case '.xls': return <FolderOpenIcon />;
            default: return <FolderOpenIcon />;
        }
    };

    const getStatusColor = () => {
        if (!status.enabled) return 'default';
        if (status.isWatching) return 'success';
        return 'warning';
    };

    const getStatusText = () => {
        if (!status.enabled) return 'Disabled';
        if (status.isWatching) return 'Watching';
        return 'Not Watching';
    };

    if (!isElectron) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        File Watcher Settings
                    </Typography>
                    <Alert severity="info">
                        File watcher settings are only available in the desktop application.
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                        File Watcher Settings
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            icon={status.isWatching ? <PlayIcon /> : <StopIcon />}
                            label={getStatusText()}
                            color={getStatusColor()}
                            size="small"
                        />
                        <Tooltip title="Refresh Status">
                            <IconButton 
                                onClick={loadFileWatcherStatus} 
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

                {/* Enable/Disable Switch */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={status.enabled}
                            onChange={(e) => handleToggleEnabled()}
                            disabled={loading}
                        />
                    }
                    label="Enable File Watcher"
                    sx={{ mb: 2 }}
                />

                {/* Folder Selection */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Watched Folder
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TextField
                            fullWidth
                            value={status.folderPath || ''}
                            placeholder="No folder selected"
                            InputProps={{
                                readOnly: true,
                                startAdornment: <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            size="small"
                        />
                        <Button
                            variant="outlined"
                            onClick={handleSelectFolder}
                            disabled={loading}
                            size="small"
                        >
                            Select
                        </Button>
                        {status.folderPath && (
                            <Button
                                variant="outlined"
                                onClick={handleClearFolder}
                                disabled={loading}
                                size="small"
                                color="error"
                            >
                                Clear
                            </Button>
                        )}
                    </Box>
                    {status.folderPath && (
                        <Typography variant="caption" color="text.secondary">
                            Watching for file changes in: {status.folderPath}
                        </Typography>
                    )}
                </Box>

                {/* Test Button */}
                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        onClick={handleTestWatcher}
                        disabled={testing || !status.enabled || !status.folderPath}
                        startIcon={testing ? <CircularProgress size={16} /> : <CheckIcon />}
                    >
                        {testing ? 'Testing...' : 'Test File Watcher'}
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        Creates a test file in the watched folder to verify the watcher is working
                    </Typography>
                </Box>

                {/* Supported File Types */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Supported File Types
                    </Typography>
                    <List dense>
                        {supportedTypes.map((fileType, index) => (
                            <React.Fragment key={fileType.extension}>
                                <ListItem>
                                    <ListItemIcon>
                                        {getFileTypeIcon(fileType.extension)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={fileType.name}
                                        secondary={fileType.extension}
                                    />
                                </ListItem>
                                {index < supportedTypes.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>

                {/* Information */}
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        The file watcher monitors the selected folder for new files and automatically 
                        detects supported file types. When a new file is detected, you'll receive a 
                        notification and the file can be automatically imported into the application.
                    </Typography>
                </Alert>
            </CardContent>
        </Card>
    );
};

export default FileWatcherSettings; 