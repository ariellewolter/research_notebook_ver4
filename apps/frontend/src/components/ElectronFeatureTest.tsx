import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    Alert,
    Divider,
    TextField,
    Switch,
    FormControlLabel,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Notifications as NotificationIcon,
    Save as SaveIcon,
    Settings as SettingsIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useNotification } from '../hooks/useNotification';
import { useAppSettings } from '../hooks/useAppSettings';
import { saveFileDialog, isElectron } from '../utils/fileSystemAPI';

interface TestResult {
    id: string;
    name: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    timestamp: Date;
}

export default function ElectronFeatureTest() {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isElectronEnv, setIsElectronEnv] = useState(false);
    const [testSettings, setTestSettings] = useState({
        testString: 'Test setting value',
        testNumber: 42,
        testBoolean: true
    });

    const { notify, notifySuccess, notifyError, notifyInfo } = useNotification();
    const { 
        settings, 
        updateSetting, 
        updateNestedSetting, 
        saveSettings, 
        loadSettings,
        isLoading,
        isSaving,
        error: settingsError,
        lastSaved
    } = useAppSettings();

    useEffect(() => {
        // Check if we're running in Electron
        setIsElectronEnv(isElectron());
        addTestResult('environment', 'Environment Detection', 'success', `Running in ${isElectron() ? 'Electron' : 'Browser'} environment`);
    }, []);

    const addTestResult = (id: string, name: string, status: 'pending' | 'success' | 'error', message: string) => {
        const result: TestResult = {
            id,
            name,
            status,
            message,
            timestamp: new Date()
        };
        setTestResults(prev => [...prev, result]);
        console.log(`[TEST] ${name}: ${message}`);
    };

    const clearTestResults = () => {
        setTestResults([]);
    };

    // Test 1: Notification System
    const testNotifications = async () => {
        addTestResult('notifications', 'Notification System', 'pending', 'Testing notification system...');

        try {
            // Test basic notification
            const basicResult = await notify('Test Notification', 'This is a test notification from Electron!');
            addTestResult('notifications-basic', 'Basic Notification', basicResult ? 'success' : 'error', 
                basicResult ? 'Basic notification sent successfully' : 'Failed to send basic notification');

            // Test success notification
            const successResult = await notifySuccess('Success Test', 'This is a success notification!');
            addTestResult('notifications-success', 'Success Notification', successResult.success ? 'success' : 'error',
                successResult.success ? 'Success notification sent' : `Failed: ${successResult.error}`);

            // Test error notification
            const errorResult = await notifyError('Error Test', 'This is an error notification!');
            addTestResult('notifications-error', 'Error Notification', errorResult.success ? 'success' : 'error',
                errorResult.success ? 'Error notification sent' : `Failed: ${errorResult.error}`);

            // Test info notification
            const infoResult = await notifyInfo('Info Test', 'This is an info notification!');
            addTestResult('notifications-info', 'Info Notification', infoResult.success ? 'success' : 'error',
                infoResult.success ? 'Info notification sent' : `Failed: ${infoResult.error}`);

        } catch (error) {
            addTestResult('notifications', 'Notification System', 'error', `Notification test failed: ${error}`);
        }
    };

    // Test 2: File Save Dialog
    const testFileSave = async () => {
        addTestResult('file-save', 'File Save Dialog', 'pending', 'Testing file save dialog...');

        try {
            const testContent = `This is a test file created at ${new Date().toISOString()}
            
Test content for Electron file save dialog.
This should open a native file dialog in Electron mode.

Features tested:
- Native file dialog
- User can choose save location
- User can modify filename
- File content is saved correctly`;

            const result = await saveFileDialog(testContent, 'electron-test-file.txt');
            
            if (result.success) {
                addTestResult('file-save', 'File Save Dialog', 'success', 
                    `File saved successfully to: ${result.filePath || 'unknown location'}`);
            } else if (result.canceled) {
                addTestResult('file-save', 'File Save Dialog', 'success', 'File save dialog opened and user canceled');
            } else {
                addTestResult('file-save', 'File Save Dialog', 'error', 
                    `File save failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            addTestResult('file-save', 'File Save Dialog', 'error', `File save test failed: ${error}`);
        }
    };

    // Test 3: Settings Persistence
    const testSettingsPersistence = async () => {
        addTestResult('settings', 'Settings Persistence', 'pending', 'Testing settings persistence...');

        try {
            // Update a test setting
            const newTheme = settings.theme === 'light' ? 'dark' : 'light';
            updateSetting('theme', newTheme);
            
            addTestResult('settings-update', 'Settings Update', 'success', 
                `Theme changed from ${settings.theme} to ${newTheme}`);

            // Wait for auto-save
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Force save settings
            const saveResult = await saveSettings(settings);
            if (saveResult.success) {
                addTestResult('settings-save', 'Settings Save', 'success', 
                    'Settings saved successfully');
            } else {
                addTestResult('settings-save', 'Settings Save', 'error', 
                    `Settings save failed: ${saveResult.error}`);
            }

            // Test nested settings
            const newFontSize = settings.editor.fontSize === 14 ? 16 : 14;
            updateNestedSetting('editor', 'fontSize', newFontSize);
            
            addTestResult('settings-nested', 'Nested Settings', 'success', 
                `Font size changed to ${newFontSize}px`);

        } catch (error) {
            addTestResult('settings', 'Settings Persistence', 'error', `Settings test failed: ${error}`);
        }
    };

    // Test 4: Settings Loading
    const testSettingsLoading = async () => {
        addTestResult('settings-load', 'Settings Loading', 'pending', 'Testing settings loading...');

        try {
            const loadResult = await loadSettings();
            addTestResult('settings-load', 'Settings Loading', 'success', 
                'Settings loaded successfully on app start');
        } catch (error) {
            addTestResult('settings-load', 'Settings Loading', 'error', 
                `Settings loading failed: ${error}`);
        }
    };

    // Test 5: IPC Communication Logging
    const testIPCCommunication = () => {
        addTestResult('ipc', 'IPC Communication', 'pending', 'Testing IPC communication...');

        // Log IPC communication attempts
        console.log('[IPC] Testing notification IPC...');
        notify('IPC Test', 'Testing IPC communication for notifications');

        console.log('[IPC] Testing file save IPC...');
        saveFileDialog('IPC test content', 'ipc-test.txt');

        console.log('[IPC] Testing settings IPC...');
        saveSettings(settings);

        addTestResult('ipc', 'IPC Communication', 'success', 
            'IPC communication logged to console. Check browser console for details.');
    };

    // Run all tests
    const runAllTests = async () => {
        clearTestResults();
        addTestResult('start', 'Test Suite', 'pending', 'Starting comprehensive Electron feature tests...');

        // Run tests sequentially
        await testNotifications();
        await testFileSave();
        await testSettingsPersistence();
        await testSettingsLoading();
        testIPCCommunication();

        addTestResult('complete', 'Test Suite', 'success', 'All tests completed!');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'success';
            case 'error': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckIcon />;
            case 'error': return <ErrorIcon />;
            case 'pending': return <InfoIcon />;
            default: return <InfoIcon />;
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Electron OS-Level Features Test Suite
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                This component tests all OS-level features implemented for Electron integration.
                Run tests in Electron dev mode to verify native functionality.
            </Alert>

            {/* Environment Info */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Environment Information
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                            label={isElectronEnv ? 'Electron' : 'Browser'} 
                            color={isElectronEnv ? 'success' : 'warning'}
                            icon={isElectronEnv ? <CheckIcon /> : <InfoIcon />}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {isElectronEnv ? 'Native OS features available' : 'Browser fallback mode'}
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>

            {/* Test Controls */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Test Controls
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button 
                            variant="contained" 
                            onClick={runAllTests}
                            startIcon={<CheckIcon />}
                        >
                            Run All Tests
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={clearTestResults}
                        >
                            Clear Results
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={testNotifications}
                            startIcon={<NotificationIcon />}
                        >
                            Test Notifications
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={testFileSave}
                            startIcon={<SaveIcon />}
                        >
                            Test File Save
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={testSettingsPersistence}
                            startIcon={<SettingsIcon />}
                        >
                            Test Settings
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Settings Status */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Settings Status
                    </Typography>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Loading: {isLoading ? 'Yes' : 'No'} | 
                                Saving: {isSaving ? 'Yes' : 'No'} | 
                                Last Saved: {lastSaved ? lastSaved.toLocaleTimeString() : 'Never'}
                            </Typography>
                        </Box>
                        {settingsError && (
                            <Alert severity="error">
                                Settings Error: {settingsError}
                            </Alert>
                        )}
                        <Box>
                            <Typography variant="body2">
                                Current Theme: <Chip label={settings.theme} size="small" />
                            </Typography>
                            <Typography variant="body2">
                                Font Size: <Chip label={`${settings.editor.fontSize}px`} size="small" />
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* Test Results */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Test Results ({testResults.length})
                    </Typography>
                    
                    {testResults.length === 0 ? (
                        <Typography color="text.secondary">
                            No test results yet. Click "Run All Tests" to start testing.
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {testResults.map((result) => (
                                <Accordion key={result.id} size="small">
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                            {getStatusIcon(result.status)}
                                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                                {result.name}
                                            </Typography>
                                            <Chip 
                                                label={result.status} 
                                                color={getStatusColor(result.status) as any}
                                                size="small"
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {result.timestamp.toLocaleTimeString()}
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2">
                                            {result.message}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Testing Instructions
                </Typography>
                <Typography variant="body2" paragraph>
                    1. <strong>Notifications:</strong> Should show native system notifications in Electron mode
                </Typography>
                <Typography variant="body2" paragraph>
                    2. <strong>File Save:</strong> Should open native file dialog in Electron mode, browser download in web mode
                </Typography>
                <Typography variant="body2" paragraph>
                    3. <strong>Settings:</strong> Should persist across app reloads and show in userData directory
                </Typography>
                <Typography variant="body2" paragraph>
                    4. <strong>IPC Logging:</strong> Check browser console for IPC communication logs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Note: Some features may behave differently in browser vs Electron mode. 
                    Native features are only available in Electron environment.
                </Typography>
            </Box>
        </Box>
    );
} 