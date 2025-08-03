import React, { useRef } from 'react';
import {
    Box,
    Typography,
    Switch,
    Slider,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Card,
    CardContent,
    Divider,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    useAppSettings,
    useTheme,
    useEditorPreferences,
    useNotificationPreferences
} from '@/hooks/useAppSettings';

/**
 * Example component demonstrating the use of the settings hook
 */
export default function SettingsExample() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        settings,
        isLoading,
        isSaving,
        error,
        lastSaved,
        updateSetting,
        updateNestedSetting,
        resetSettings,
        exportSettings,
        importSettings
    } = useAppSettings();

    const { theme, primaryColor, secondaryColor, setTheme, setPrimaryColor, setSecondaryColor } = useTheme();

    const {
        fontSize,
        fontFamily,
        lineHeight,
        tabSize,
        wordWrap,
        minimap,
        autoSave,
        autoSaveInterval,
        updateFontSize,
        updateFontFamily,
        updateLineHeight,
        updateTabSize,
        updateWordWrap,
        updateMinimap,
        updateAutoSave,
        updateAutoSaveInterval
    } = useEditorPreferences();

    const {
        enabled: notificationsEnabled,
        sound,
        desktop,
        browser,
        autoHide,
        autoHideDelay,
        position,
        updateEnabled: updateNotificationsEnabled,
        updateSound,
        updateDesktop,
        updateBrowser,
        updateAutoHide,
        updateAutoHideDelay,
        updatePosition
    } = useNotificationPreferences();

    const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const result = await importSettings(file);
            if (result.success) {
                console.log('Settings imported successfully');
            } else {
                console.error('Failed to import settings:', result.error);
            }
        }
    };

    const handleExportSettings = () => {
        exportSettings();
    };

    const handleResetSettings = async () => {
        if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
            await resetSettings();
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Application Settings
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Last saved: {lastSaved ? lastSaved.toLocaleString() : 'Never'}
                </Typography>
                {isSaving && (
                    <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                            Saving...
                        </Typography>
                    </Box>
                )}
            </Box>

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button variant="outlined" onClick={handleExportSettings}>
                    Export Settings
                </Button>
                <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
                    Import Settings
                </Button>
                <Button variant="outlined" color="warning" onClick={handleResetSettings}>
                    Reset to Defaults
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportSettings}
                />
            </Stack>

            <Stack spacing={3}>
                {/* Theme Settings */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Theme Settings
                        </Typography>
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Theme</InputLabel>
                                <Select
                                    value={theme}
                                    label="Theme"
                                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                                >
                                    <MenuItem value="light">Light</MenuItem>
                                    <MenuItem value="dark">Dark</MenuItem>
                                    <MenuItem value="system">System</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Primary Color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                fullWidth
                            />

                            <TextField
                                label="Secondary Color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                fullWidth
                            />
                        </Stack>
                    </CardContent>
                </Card>

                {/* Editor Preferences */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Editor Preferences
                        </Typography>
                        <Stack spacing={2}>
                            <Box>
                                <Typography gutterBottom>Font Size: {fontSize}px</Typography>
                                <Slider
                                    value={fontSize}
                                    onChange={(_, value) => updateFontSize(value as number)}
                                    min={8}
                                    max={24}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <TextField
                                label="Font Family"
                                value={fontFamily}
                                onChange={(e) => updateFontFamily(e.target.value)}
                                fullWidth
                            />

                            <Box>
                                <Typography gutterBottom>Line Height: {lineHeight}</Typography>
                                <Slider
                                    value={lineHeight}
                                    onChange={(_, value) => updateLineHeight(value as number)}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <Box>
                                <Typography gutterBottom>Tab Size: {tabSize}</Typography>
                                <Slider
                                    value={tabSize}
                                    onChange={(_, value) => updateTabSize(value as number)}
                                    min={2}
                                    max={8}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel>Word Wrap</InputLabel>
                                <Select
                                    value={wordWrap}
                                    label="Word Wrap"
                                    onChange={(e) => updateWordWrap(e.target.value as any)}
                                >
                                    <MenuItem value="off">Off</MenuItem>
                                    <MenuItem value="on">On</MenuItem>
                                    <MenuItem value="wordWrapColumn">Word Wrap Column</MenuItem>
                                    <MenuItem value="bounded">Bounded</MenuItem>
                                </Select>
                            </FormControl>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Show Minimap</Typography>
                                <Switch
                                    checked={minimap}
                                    onChange={(e) => updateMinimap(e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Auto Save</Typography>
                                <Switch
                                    checked={autoSave}
                                    onChange={(e) => updateAutoSave(e.target.checked)}
                                />
                            </Box>

                            {autoSave && (
                                <Box>
                                    <Typography gutterBottom>Auto Save Interval: {autoSaveInterval}s</Typography>
                                    <Slider
                                        value={autoSaveInterval}
                                        onChange={(_, value) => updateAutoSaveInterval(value as number)}
                                        min={5}
                                        max={300}
                                        step={5}
                                        marks
                                        valueLabelDisplay="auto"
                                    />
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Notification Preferences
                        </Typography>
                        <Stack spacing={2}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Enable Notifications</Typography>
                                <Switch
                                    checked={notificationsEnabled}
                                    onChange={(e) => updateNotificationsEnabled(e.target.checked)}
                                />
                            </Box>

                            {notificationsEnabled && (
                                <>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography>Sound</Typography>
                                        <Switch
                                            checked={sound}
                                            onChange={(e) => updateSound(e.target.checked)}
                                        />
                                    </Box>

                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography>Desktop Notifications</Typography>
                                        <Switch
                                            checked={desktop}
                                            onChange={(e) => updateDesktop(e.target.checked)}
                                        />
                                    </Box>

                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography>Browser Notifications</Typography>
                                        <Switch
                                            checked={browser}
                                            onChange={(e) => updateBrowser(e.target.checked)}
                                        />
                                    </Box>

                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography>Auto Hide</Typography>
                                        <Switch
                                            checked={autoHide}
                                            onChange={(e) => updateAutoHide(e.target.checked)}
                                        />
                                    </Box>

                                    {autoHide && (
                                        <Box>
                                            <Typography gutterBottom>Auto Hide Delay: {autoHideDelay}ms</Typography>
                                            <Slider
                                                value={autoHideDelay}
                                                onChange={(_, value) => updateAutoHideDelay(value as number)}
                                                min={1000}
                                                max={10000}
                                                step={500}
                                                marks
                                                valueLabelDisplay="auto"
                                            />
                                        </Box>
                                    )}

                                    <FormControl fullWidth>
                                        <InputLabel>Position</InputLabel>
                                        <Select
                                            value={position}
                                            label="Position"
                                            onChange={(e) => updatePosition(e.target.value as any)}
                                        >
                                            <MenuItem value="top-right">Top Right</MenuItem>
                                            <MenuItem value="top-left">Top Left</MenuItem>
                                            <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                            <MenuItem value="bottom-left">Bottom Left</MenuItem>
                                        </Select>
                                    </FormControl>
                                </>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* UI Preferences */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            UI Preferences
                        </Typography>
                        <Stack spacing={2}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Sidebar Collapsed</Typography>
                                <Switch
                                    checked={settings.ui.sidebarCollapsed}
                                    onChange={(e) => updateNestedSetting('ui', 'sidebarCollapsed', e.target.checked)}
                                />
                            </Box>

                            <Box>
                                <Typography gutterBottom>Sidebar Width: {settings.ui.sidebarWidth}px</Typography>
                                <Slider
                                    value={settings.ui.sidebarWidth}
                                    onChange={(_, value) => updateNestedSetting('ui', 'sidebarWidth', value as number)}
                                    min={200}
                                    max={400}
                                    step={10}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Show Toolbar</Typography>
                                <Switch
                                    checked={settings.ui.showToolbar}
                                    onChange={(e) => updateNestedSetting('ui', 'showToolbar', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Show Status Bar</Typography>
                                <Switch
                                    checked={settings.ui.showStatusBar}
                                    onChange={(e) => updateNestedSetting('ui', 'showStatusBar', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Compact Mode</Typography>
                                <Switch
                                    checked={settings.ui.compactMode}
                                    onChange={(e) => updateNestedSetting('ui', 'compactMode', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Animations</Typography>
                                <Switch
                                    checked={settings.ui.animations}
                                    onChange={(e) => updateNestedSetting('ui', 'animations', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Reduced Motion</Typography>
                                <Switch
                                    checked={settings.ui.reducedMotion}
                                    onChange={(e) => updateNestedSetting('ui', 'reducedMotion', e.target.checked)}
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Data Preferences */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Data Preferences
                        </Typography>
                        <Stack spacing={2}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Auto Backup</Typography>
                                <Switch
                                    checked={settings.data.autoBackup}
                                    onChange={(e) => updateNestedSetting('data', 'autoBackup', e.target.checked)}
                                />
                            </Box>

                            {settings.data.autoBackup && (
                                <Box>
                                    <Typography gutterBottom>Backup Interval: {settings.data.backupInterval}h</Typography>
                                    <Slider
                                        value={settings.data.backupInterval}
                                        onChange={(_, value) => updateNestedSetting('data', 'backupInterval', value as number)}
                                        min={1}
                                        max={168} // 1 week
                                        step={1}
                                        marks
                                        valueLabelDisplay="auto"
                                    />
                                </Box>
                            )}

                            <Box>
                                <Typography gutterBottom>Max Backups: {settings.data.maxBackups}</Typography>
                                <Slider
                                    value={settings.data.maxBackups}
                                    onChange={(_, value) => updateNestedSetting('data', 'maxBackups', value as number)}
                                    min={1}
                                    max={50}
                                    step={1}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel>Export Format</InputLabel>
                                <Select
                                    value={settings.data.exportFormat}
                                    label="Export Format"
                                    onChange={(e) => updateNestedSetting('data', 'exportFormat', e.target.value as any)}
                                >
                                    <MenuItem value="json">JSON</MenuItem>
                                    <MenuItem value="csv">CSV</MenuItem>
                                    <MenuItem value="pdf">PDF</MenuItem>
                                </Select>
                            </FormControl>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Import Confirmation</Typography>
                                <Switch
                                    checked={settings.data.importConfirm}
                                    onChange={(e) => updateNestedSetting('data', 'importConfirm', e.target.checked)}
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Privacy Settings
                        </Typography>
                        <Stack spacing={2}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Analytics</Typography>
                                <Switch
                                    checked={settings.privacy.analytics}
                                    onChange={(e) => updateNestedSetting('privacy', 'analytics', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Crash Reports</Typography>
                                <Switch
                                    checked={settings.privacy.crashReports}
                                    onChange={(e) => updateNestedSetting('privacy', 'crashReports', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Telemetry</Typography>
                                <Switch
                                    checked={settings.privacy.telemetry}
                                    onChange={(e) => updateNestedSetting('privacy', 'telemetry', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Data Collection</Typography>
                                <Switch
                                    checked={settings.privacy.dataCollection}
                                    onChange={(e) => updateNestedSetting('privacy', 'dataCollection', e.target.checked)}
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Advanced Settings
                        </Typography>
                        <Stack spacing={2}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Debug Mode</Typography>
                                <Switch
                                    checked={settings.advanced.debugMode}
                                    onChange={(e) => updateNestedSetting('advanced', 'debugMode', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Experimental Features</Typography>
                                <Switch
                                    checked={settings.advanced.experimentalFeatures}
                                    onChange={(e) => updateNestedSetting('advanced', 'experimentalFeatures', e.target.checked)}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography>Developer Mode</Typography>
                                <Switch
                                    checked={settings.advanced.developerMode}
                                    onChange={(e) => updateNestedSetting('advanced', 'developerMode', e.target.checked)}
                                />
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel>Log Level</InputLabel>
                                <Select
                                    value={settings.advanced.logLevel}
                                    label="Log Level"
                                    onChange={(e) => updateNestedSetting('advanced', 'logLevel', e.target.value as any)}
                                >
                                    <MenuItem value="error">Error</MenuItem>
                                    <MenuItem value="warn">Warning</MenuItem>
                                    <MenuItem value="info">Info</MenuItem>
                                    <MenuItem value="debug">Debug</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    Settings are automatically saved when changed. Check the browser console for detailed logs.
                </Typography>
            </Box>
        </Box>
    );
} 